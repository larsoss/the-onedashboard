import { useMemo } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHA } from '@/hooks/useHAClient'
import { getDomain } from '@/lib/utils'

const TILE_DOMAINS = new Set([
  'light', 'switch', 'input_boolean', 'climate', 'lock', 'cover', 'sensor', 'binary_sensor',
])

interface RoomTabsProps {
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function RoomTabs({ activeTab, onTabChange }: RoomTabsProps) {
  const { haAreas, customAreas, entities, resolveEntityArea } = useHA()

  // Only show area tabs that actually have entities assigned
  const areaTabs = useMemo(() => {
    const allAreas = [
      ...haAreas.map((a) => ({ area_id: a.area_id, name: a.name })),
      ...customAreas,
    ]

    return allAreas.filter((area) =>
      Object.keys(entities).some((eid) => {
        if (!TILE_DOMAINS.has(getDomain(eid))) return false
        return resolveEntityArea(eid) === area.area_id
      })
    )
  }, [haAreas, customAreas, entities, resolveEntityArea])

  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        {areaTabs.map((area) => (
          <TabsTrigger key={area.area_id} value={area.area_id}>
            {area.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
