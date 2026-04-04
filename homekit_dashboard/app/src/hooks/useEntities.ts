import { useMemo } from 'react'
import { useHA } from './useHAClient'
import type { HassEntity } from '@/types/ha-types'
import { getDomain } from '@/lib/utils'

export function useEntitiesByDomain(domains: string[]): HassEntity[] {
  const { entities } = useHA()
  return useMemo(() => {
    const all = Object.values(entities)
    if (domains.length === 0) return all
    return all.filter((e) => domains.includes(getDomain(e.entity_id)))
  }, [entities, domains])
}

export function useEntity(entityId: string): HassEntity | undefined {
  const { entities } = useHA()
  return entities[entityId]
}
