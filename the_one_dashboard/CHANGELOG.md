# Changelog

## [2.0.1] - 2026-04-15

- feat: professional settings panel redesign — grouped entities, domain filters, live state

## [2.0.0] - 2026-04-14

### Tiles
- Light tiles — tap to toggle, long-press brightness slider, tap for color dialog (HSV wheel, color temp, presets, light groups)
- Switch / Input Boolean tiles — tap to toggle
- Thermostat / Climate tiles — temperature dialog with +/– controls, mode selector (heat/cool/heat_cool/auto/fan/dry), optimistic instant feedback
- Lock tiles — unlock confirmation dialog, instant lock
- Cover / Blind tiles — tap open/close, long-press position slider, Open/Stop/Close buttons
- Sensor / Binary Sensor tiles — read-only with device-class icons
- Scene tiles — tap to activate
- Automation tiles — toggle enabled/disabled, trigger button
- Script tiles — run with spinner while executing
- Weather tiles — current conditions + 3-day forecast row
- Media Player tiles — Spotify-style with blurred art background, real-time progress bar, shuffle/repeat, volume
- Camera tiles — live snapshot (10s refresh), tap for full-screen HLS stream
- Calendar tiles — next event + 7-day modal
- Person tiles — avatar, zone, linked sensors (battery, WiFi, steps, activity, proximity, Spotify, ringer, geocoded address)

### Home View
- Favorites section — starred entities pinned to top
- People section — person cards side by side with equal height
- Room cards — area cards with icon, active device count, temperature; tap to navigate
- Custom background photos on room cards — upload JPEG in edit mode, dark gradient overlay

### Edit Mode
- Tile resize — drag bottom-right handle to 1×1 / 2×1 / 4×1 / 1×2 / 2×2 / 4×2
- Drag to reorder tiles within an area
- Hide / restore tiles per entity
- Custom icon picker (43 presets) per entity
- Favorite toggle per entity
- Add entities to any area (search + multi-select)
- Room card resize + background image upload/remove
- Undo last hide via toolbar

### Settings
- Areas tab — entity area assignment, custom areas, icon/favorite/hide per entity, restore hidden
- Appearance tab — accent color, tile style (glass/solid), tile size, icon size, opacity slider, background theme

### Sidebar
- Collapsible left panel (overlay on mobile, persistent on desktop)
- Clock with time-of-day greeting using your HA user name
- Current weather (temperature + condition)
- Active device counters (lights on, switches on, covers open)
- Persistent notification alerts with dismiss
- Quick-navigate to any room

### Infrastructure
- Zero-config HA add-on — auto-connects via Supervisor token
- WebSocket real-time state updates
- Per-user settings namespaced in localStorage with cross-device sync to HA server
- Auto-detect logged-in user via ingress `X-Hass-User-ID` header
- Optimistic UI — all interactive tiles update instantly without waiting for HA round-trip
- Pre-built React frontend bundled in Docker image for fast add-on updates
- URL params: `?view=<area_id>` deep-link, `?menu=false` kiosk mode
- 12-language i18n (auto-detected from HA language setting)

---

## [1.0.0] - 2026-04-04

- Initial release — HomeKit-style dashboard as a Home Assistant add-on
- Light, switch, thermostat, lock, cover, sensor, person tiles
- Area-based rooms, glassmorphism tile style, HA ingress integration
