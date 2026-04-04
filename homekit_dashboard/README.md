# HomeKit Dashboard — Home Assistant Add-on

A HomeKit-style dashboard for Home Assistant. Displays all your entities (lights, thermostats, locks, switches, covers, sensors) as interactive tiles in Apple Home's dark aesthetic.

## Features

- **HomeKit-style UI** — dark iOS colour palette, square tiles, smooth interactions
- **All entity types** — lights (brightness), thermostats (temperature + mode), locks, switches, covers (position), sensors
- **Real-time** — WebSocket connection to HA for instant state updates
- **Zero configuration** — automatically connects via the HA Supervisor token
- **Room tabs** — filter by domain (All / Lights / Climate / Security / Switches / Covers / Sensors)

## Installation

### Option 1: Custom Repository (recommended)

1. In Home Assistant go to **Settings → Add-ons → Add-on Store**
2. Click the **⋮** menu → **Repositories**
3. Add: `https://github.com/YOUR_USERNAME/homekit-dashboard`
4. Find **HomeKit Dashboard** in the store and click **Install**
5. Click **Start**
6. The dashboard appears in your HA sidebar

### Option 2: Local Add-on

1. Copy this folder to `/config/addons/homekit_dashboard/` on your HA host
2. In Add-on Store, click **⋮** → **Check for updates**
3. Find **HomeKit Dashboard** (Local) → **Install** → **Start**

## Usage

The dashboard auto-populates with all your entities. No login or token entry required.

- **Tap** a light/switch/lock/cover tile to toggle it
- **Long-press** a light or cover tile to open a brightness/position slider
- **Tap** a thermostat tile to open temperature and mode controls
- **Tap** a lock tile — shows a confirmation dialog before unlocking

## Development

```bash
# Run the proxy server locally (requires SUPERVISOR_TOKEN env var)
cd server && npm install && SUPERVISOR_TOKEN=your_token node server.js

# Run the React dev server
cd app && npm install && npm run dev
```
