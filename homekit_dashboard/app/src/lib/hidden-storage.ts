import { userKey } from './user-context'

function key() { return userKey('hk_hidden_entities') }

export function getHiddenEntities(): string[] {
  try {
    return JSON.parse(localStorage.getItem(key()) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function saveHiddenEntities(ids: string[]): void {
  localStorage.setItem(key(), JSON.stringify(ids))
}
