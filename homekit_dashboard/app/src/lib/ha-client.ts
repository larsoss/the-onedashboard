import type {
  HassEntity,
  HassWsMessage,
  HassResult,
  HassEvent,
  HassArea,
  HassEntityRegistryEntry,
  ConnectionStatus,
} from '@/types/ha-types'

type StateChangeHandler = (entityId: string, newState: HassEntity | null) => void
type StatusChangeHandler = (status: ConnectionStatus) => void

function buildWsUrl(): string {
  const loc = window.location
  const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:'
  // Ensure base path ends with /
  const base = loc.pathname.endsWith('/') ? loc.pathname : loc.pathname + '/'
  return `${proto}//${loc.host}${base}ws`
}

export class HAClient {
  private ws: WebSocket | null = null
  private msgId = 1
  private pendingCallbacks = new Map<number, (result: HassResult) => void>()
  private stateHandlers: StateChangeHandler[] = []
  private statusHandlers: StatusChangeHandler[] = []
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private shouldReconnect = true
  private readonly wsUrl: string

  constructor() {
    this.wsUrl = buildWsUrl()
  }

  connect(): void {
    this.shouldReconnect = true
    this._connect()
  }

  disconnect(): void {
    this.shouldReconnect = false
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
    this.ws = null
    this._emitStatus('disconnected')
  }

  callService(
    domain: string,
    service: string,
    serviceData: Record<string, unknown>,
    entityId?: string
  ): Promise<HassResult> {
    return new Promise((resolve, reject) => {
      const id = this._nextId()
      const msg: HassWsMessage = {
        id,
        type: 'call_service',
        domain,
        service,
        service_data: entityId
          ? { entity_id: entityId, ...serviceData }
          : serviceData,
      }
      this.pendingCallbacks.set(id, (result) => {
        if (result.success) resolve(result)
        else reject(new Error(result.error?.message ?? 'Service call failed'))
      })
      this._send(msg)
    })
  }

  // Generic one-shot WS request — used for registry queries
  callWS<T>(message: HassWsMessage): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = this._nextId()
      this._send({ ...message, id })
      this.pendingCallbacks.set(id, (result) => {
        if (result.success) resolve(result.result as T)
        else reject(new Error(result.error?.message ?? 'WS call failed'))
      })
    })
  }

  getAreas(): Promise<HassArea[]> {
    return this.callWS<HassArea[]>({ type: 'config/area_registry/list', id: 0 })
  }

  getEntityRegistry(): Promise<HassEntityRegistryEntry[]> {
    return this.callWS<HassEntityRegistryEntry[]>({ type: 'config/entity_registry/list', id: 0 })
  }

  onStateChange(handler: StateChangeHandler): () => void {
    this.stateHandlers.push(handler)
    return () => {
      this.stateHandlers = this.stateHandlers.filter((h) => h !== handler)
    }
  }

  onStatusChange(handler: StatusChangeHandler): () => void {
    this.statusHandlers.push(handler)
    return () => {
      this.statusHandlers = this.statusHandlers.filter((h) => h !== handler)
    }
  }

  private _connect(): void {
    this._emitStatus('connecting')
    try {
      this.ws = new WebSocket(this.wsUrl)
    } catch {
      this._emitStatus('error')
      this._scheduleReconnect()
      return
    }

    this.ws.onmessage = (ev: MessageEvent) => {
      let msg: HassWsMessage
      try {
        msg = JSON.parse(ev.data as string) as HassWsMessage
      } catch {
        return
      }

      if (msg.type === 'auth_required') {
        this._emitStatus('authenticating')
        // Proxy handles real auth; send dummy so HAClient state machine advances
        this._send({ type: 'auth', access_token: 'proxy' })
        return
      }

      if (msg.type === 'auth_ok') {
        this._emitStatus('connected')
        this._subscribeEvents()
        return
      }

      if (msg.type === 'auth_invalid') {
        this._emitStatus('error')
        this.shouldReconnect = false
        this.ws?.close()
        return
      }

      if (msg.type === 'result') {
        const result = msg as unknown as HassResult
        const cb = this.pendingCallbacks.get(result.id)
        if (cb) {
          cb(result)
          this.pendingCallbacks.delete(result.id)
        }
        return
      }

      if (msg.type === 'event') {
        const event = msg as unknown as HassEvent
        if (event.event?.event_type === 'state_changed') {
          const { entity_id, new_state } = event.event.data
          this.stateHandlers.forEach((h) => h(entity_id, new_state))
        }
      }
    }

    this.ws.onerror = () => {
      this._emitStatus('error')
    }

    this.ws.onclose = () => {
      if (this.shouldReconnect) {
        this._scheduleReconnect()
      } else {
        this._emitStatus('disconnected')
      }
    }
  }

  private _subscribeEvents(): void {
    const id = this._nextId()
    this._send({ id, type: 'subscribe_events', event_type: 'state_changed' })
    // Consume the subscription ack so the callback map doesn't leak
    this.pendingCallbacks.set(id, () => undefined)
  }

  private _scheduleReconnect(): void {
    this._emitStatus('connecting')
    this.reconnectTimer = setTimeout(() => this._connect(), 5000)
  }

  private _send(msg: HassWsMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  private _nextId(): number {
    return this.msgId++
  }

  private _emitStatus(status: ConnectionStatus): void {
    this.statusHandlers.forEach((h) => h(status))
  }
}
