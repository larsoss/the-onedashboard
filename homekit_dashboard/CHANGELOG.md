# Changelog

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
