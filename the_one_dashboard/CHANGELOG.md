# Changelog

## [2.0.15] - 2026-04-17

- feat: add Cyber Glass mood + neon glow toggle for glass tiles

## [2.0.14] - 2026-04-17

- fix: redesign edit mode overlay — clean layout with name + icon buttons

## [2.0.13] - 2026-04-17

- fix: switch analytics key to legacy JWT anon key (no origin restrictions)

## [2.0.12] - 2026-04-17

- fix: show entity name in edit mode overlay, hide size label when idle

## [2.0.10] - 2026-04-17

- feat: anonymous install analytics via Supabase

## [2.0.9] - 2026-04-17

- fix: hide HA topbar without Browser Mod + fix toggle button sizing

## [2.0.8] - 2026-04-17

- fix: sync all settings across devices (personConfigs, floorplans, settingsVersion)

## [2.0.7] - 2026-04-17

- fix: sync area background images across devices

## [2.0.6] - 2026-04-16

- Merge remote-tracking branch 'github/main' into claude/homekit-dashboard-xSgWd

## [2.0.5] - 2026-04-16

- docs: add root README for GitHub homepage + fix screenshot paths

## [2.0.4] - 2026-04-16

- docs: use actual screenshots in README

## [2.0.3] - 2026-04-16

- feat: per-entity label overrides in dashboard

## [2.0.2] - 2026-04-16

- feat: Browser Mod topbar toggle in Appearance settings

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
