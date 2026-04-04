import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { deriveRoomTabs } from '@/lib/utils'

const TABS = deriveRoomTabs()

interface RoomTabsProps {
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function RoomTabs({ activeTab, onTabChange }: RoomTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList>
        {TABS.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
