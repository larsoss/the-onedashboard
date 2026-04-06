# Changelog

## [1.0.30] - 2026-04-06

- chore: update changelog

## [1.0.29] - 2026-04-06

- feat: person card tile with linked sensors

## [1.0.28] - 2026-04-06

- chore: update changelog

## [1.0.27] - 2026-04-06

- chore: update changelog

## [1.0.26] - 2026-04-06

- feat: light group support in color dialog

## [1.0.25] - 2026-04-06

- chore: update changelog

## [1.0.24] - 2026-04-06

- chore: update changelog and version

## [1.0.23] - 2026-04-06

- rebrand: HomeKit Dashboard → The-One Dashboard

## [1.0.22] - 2026-04-06

- chore: update changelog

## [1.0.21] - 2026-04-06

- chore: update changelog

## [1.0.20] - 2026-04-06

- feat: hide entities, drag-reorder tiles, edit mode on room cards

## [1.0.19] - 2026-04-06

- chore: update changelog

## [1.0.18] - 2026-04-06

- chore: update changelog

## [1.0.17] - 2026-04-06

- feat: home view shows area cards instead of entity sections

## [1.0.16] - 2026-04-06

- chore: update changelog

## [1.0.15] - 2026-04-06

- chore: update changelog for v1.0.14

## [1.0.14] - 2026-04-06

- feat: color picker for lights + tile edit mode

## [1.0.13] - 2026-04-06

- Sync CHANGELOG.md staged by commit-msg hook

## [1.0.12] - 2026-04-06

- Sync CHANGELOG.md staged by commit-msg hook

## [1.0.11] - 2026-04-06

- Add favorites, status overview, drag-to-reorder areas, and responsive header

## [1.0.10] - 2026-04-06

- Responsive layout, Home view, tile customization, and README update

## [1.0.9] - 2026-04-06

- Sync CHANGELOG.md staged by commit-msg hook

## [1.0.8] - 2026-04-06

- Add glassmorphism tiles, theme picker, and custom entity icons

## [1.0.7] - 2026-04-06

- Sync CHANGELOG.md staged by commit-msg hook

## [1.0.6] - 2026-04-06

- Fix area resolution via device registry + add configurable port

## [1.0.5] - 2026-04-06

- Sync CHANGELOG.md staged by commit-msg hook

## [1.0.4] - 2026-04-06

- Add CHANGELOG.md and auto-update hook on every commit

## [1.0.3] - 2026-04-06

- Add area management with entity assignment settings
- Settings panel (gear icon) to assign entities to areas
- Searchable entity picker per area
- Custom areas via localStorage
- Area-based tabs on dashboard (All + one per area)
- HA area registry + entity registry loaded on connect

## [1.0.2] - 2026-04-06

- Fix TypeScript build errors (useHAClient.ts → .tsx, unused import)
- Add package-lock.json files for reproducible Docker builds

## [1.0.1] - 2026-04-04

- Fix repository structure for valid HA add-on repository
- Add repository.json and move add-on into homekit_dashboard/ subdirectory

## [1.0.0] - 2026-04-04

- Initial release
- HomeKit-style dark dashboard for Home Assistant
- Tile types: Light (brightness), Switch, Thermostat, Climate, Lock, Cover, Sensor
- Real-time WebSocket connection via Supervisor token (zero config)
- Room tabs: All / Lights / Climate / Security / Switches / Covers / Sensors
- Node.js proxy server with automatic HA authentication
