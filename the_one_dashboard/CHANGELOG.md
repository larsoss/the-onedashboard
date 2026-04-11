# Changelog

## [1.0.54] - 2026-04-11

- feat: translate all UI strings to system language (12 languages)

## [1.0.53] - 2026-04-11

- fix: house button → home tab, remove room tabs, area card drag-resize

## [1.0.52] - 2026-04-11

- fix: thermostat tile overflow + climate count incorrect

## [1.0.51] - 2026-04-11

- feat: add search bar to settings areas panel

## [1.0.50] - 2026-04-11

- feat: easier dashboard editing — jiggle, add-entity, edit toolbar

## [1.0.49] - 2026-04-11

- perf: pre-build frontend to drastically speed up HA add-on updates

## [1.0.48] - 2026-04-11

- feat: dashboard UX improvements based on user research

## [1.0.47] - 2026-04-07

- fix: complete cross-device settings sync + HA back button

## [1.0.46] - 2026-04-07

- feat: live tile resize preview while dragging

## [1.0.44] - 2026-04-07

- feat: rename all remaining homekit references to the-one-dashboard

## [1.0.43] - 2026-04-07

- feat: new tiles, sidebar, camera, calendar, floorplan, query params

## [1.0.42] - 2026-04-07

- feat: auto-detect logged-in HA user via ingress header (X-Hass-User-ID)
- feat: per-user settings with cross-device sync, namespaced localStorage
- feat: drag-to-reorder tiles fixed (pointer-events-none overlay)
- feat: heart/favorite button on tiles in edit mode

## [1.0.35] - 2026-04-06

- feat: person card tile with linked sensors (battery, WiFi, steps, Spotify)
- feat: light group support — individual lamp cards in color dialog
- feat: hide entities from dashboard without removing from Home Assistant

## [1.0.21] - 2026-04-05

- feat: edit mode for tiles — resize (1×1, 2×1, 1×2, 2×2), reorder, hide
- feat: home view area cards — click to navigate to area
- feat: color picker for lights (hue wheel, brightness, color temp, presets)
- feat: fully responsive layout for all screen sizes
- feat: custom icon picker per entity (43 presets)
- feat: theme customization — accent color, tile style, background, opacity
- feat: The-One Dashboard rebrand

## [1.0.0] - 2026-04-04

- feat: initial release — The-One Dashboard as Home Assistant add-on
- feat: light, switch, thermostat, lock, cover, sensor, person tiles
- feat: area-based room tabs, favorites, drag-reorder areas
- feat: glassmorphism tile style with iOS color tokens
- feat: HA ingress integration with supervisor token auth
