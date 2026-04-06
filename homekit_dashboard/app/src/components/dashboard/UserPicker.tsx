import { User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HAUser } from '@/types/ha-types'

const STORAGE_KEY = 'hk_selected_user'

export function getStoredUserId(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export function storeUserId(id: string): void {
  localStorage.setItem(STORAGE_KEY, id)
}

interface UserPickerProps {
  users: HAUser[]
  onSelect: (userId: string) => void
}

export function UserPicker({ users, onSelect }: UserPickerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-ios-card rounded-3xl p-6 w-full max-w-sm space-y-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-ios-blue/20 flex items-center justify-center mx-auto mb-3">
            <User className="w-8 h-8 text-ios-blue" />
          </div>
          <h2 className="text-xl font-bold text-ios-label">Who are you?</h2>
          <p className="text-sm text-ios-secondary mt-1">
            Select your profile to personalize the dashboard
          </p>
        </div>
        <div className="space-y-2">
          {users.filter(u => u.is_active).map((user) => (
            <button
              key={user.id}
              onClick={() => { storeUserId(user.id); onSelect(user.id) }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-ios-card-2',
                'hover:bg-ios-blue/10 transition-all active:scale-95 text-left'
              )}
            >
              <div className="w-10 h-10 rounded-full bg-ios-blue/20 flex items-center justify-center shrink-0">
                <span className="text-ios-blue font-bold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-ios-label">{user.name}</p>
                {user.is_owner && (
                  <p className="text-xs text-ios-secondary">Owner</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
