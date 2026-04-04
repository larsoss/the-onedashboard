import { useState } from 'react'
import { Header } from './Header'
import { RoomTabs } from './RoomTabs'
import { TilesGrid } from './TilesGrid'
import { useEntitiesByDomain } from '@/hooks/useEntities'
import { useHA } from '@/hooks/useHAClient'
import { deriveRoomTabs } from '@/lib/utils'
import { Wifi } from 'lucide-react'

const TABS = deriveRoomTabs()

function ConnectingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-ios-secondary">
      <Wifi className="w-12 h-12 mb-4 animate-pulse" />
      <p className="text-base font-medium text-ios-label">Connecting to Home Assistant…</p>
      <p className="text-sm mt-1">This may take a moment</p>
    </div>
  )
}

function DashboardContent({ domains }: { domains: string[] }) {
  const entities = useEntitiesByDomain(domains)
  return <TilesGrid entities={entities} />
}

export function Dashboard() {
  const { status } = useHA()
  const [activeTab, setActiveTab] = useState('all')

  if (status === 'connecting' || status === 'authenticating' || status === 'disconnected') {
    return <ConnectingScreen />
  }

  const currentTab = TABS.find((t) => t.id === activeTab) ?? TABS[0]

  return (
    <div className="min-h-screen bg-ios-bg">
      <Header />
      <RoomTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <DashboardContent domains={currentTab.domains} />
    </div>
  )
}
