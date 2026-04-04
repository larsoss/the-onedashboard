import { HAProvider } from '@/hooks/useHAClient'
import { Dashboard } from '@/components/dashboard/Dashboard'

export default function Index() {
  return (
    <HAProvider>
      <Dashboard />
    </HAProvider>
  )
}
