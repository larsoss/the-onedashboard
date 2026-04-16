> **⚠️ AI Hobby Project — Work in Progress**
> Built with Claude AI. Actively under development — expect changes and occasional rough edges.

---

# The-One Dashboard

A HomeKit-style Home Assistant dashboard add-on. Glassmorphism tiles, color light controls, per-user settings, and real-time WebSocket updates — no configuration needed.

<!-- Add your screenshots to docs/screenshots/ and uncomment the lines below -->
<!-- ![Home view](docs/screenshots/home.png) -->
<!-- ![Room view](docs/screenshots/room.png) -->
<!-- ![Edit mode](docs/screenshots/edit-mode.png) -->

---

## Table of Contents

1. [Installation](#installation)
2. [Home View](#home-view)
3. [Room View](#room-view)
4. [Tile Types](#tile-types)
5. [Edit Mode](#edit-mode)
6. [Settings](#settings)
7. [Sidebar](#sidebar)
8. [Person Cards](#person-cards)
9. [Room Card Background Images](#room-card-background-images)
10. [URL Parameters](#url-parameters)
11. [Development](#development)

---

## Installation

1. Go to **Settings → Add-ons → Add-on Store** in Home Assistant
2. Click **⋮** → **Repositories** → add `https://github.com/larsoss/the-onedashboard`
3. Find **The-One Dashboard** → **Install** → **Start**
4. The dashboard appears in your HA sidebar automatically

<!-- ![Installation step](docs/screenshots/installation.png) -->

---

## Home View

The home screen has three sections:

| Section | Description |
|---------|-------------|
| **Favorites** | Entities you starred — pinned to the top |
| **People** | All `person.*` entities shown side-by-side |
| **Rooms** | Area cards — tap one to open that room |

Each area card shows:
- Active light count and temperature sensor reading
- Taps through to the full room tile grid
- Optional custom background photo (set in Edit Mode)

<!-- ![Home view](docs/screenshots/home.png) -->

---

## Room View

Tap any area card to enter that room. All supported entities for that area are shown as tiles in a responsive grid.

Swipe back or tap the room name in the header to return home.

<!-- ![Room view](docs/screenshots/room.png) -->

---

## Tile Types

### Light
- **Tap** — toggle on/off
- **Long-press** — brightness slider popover
- **Tap (color/Hue lights)** — full color dialog: HSV wheel, brightness slider, color temperature slider, presets

<!-- ![Light color dialog](docs/screenshots/light-color.png) -->

### Switch / Input Boolean
- **Tap** — toggle on/off

### Thermostat / Climate
- **Tap** — temperature & mode dialog
- **+/–** buttons update the target temperature instantly (debounced, no waiting)
- Supports `heat`, `cool`, `heat_cool`, `auto`, `fan_only`, `dry`, `off` modes

<!-- ![Thermostat dialog](docs/screenshots/thermostat.png) -->

### Lock
- **Tap when locked** — unlock confirmation dialog
- **Tap when unlocked** — locks immediately (no confirmation needed)

### Cover / Blind / Garage
- **Tap** — open or close
- **Long-press** — position slider (0–100%)
- Popover also has Open / Stop / Close buttons

### Sensor / Binary Sensor
- Read-only display with device-class icon (temperature, humidity, motion, door, etc.)

### Scene
- **Tap** — activate scene

### Automation
- **Tap** — toggle enabled/disabled
- **Run button** — trigger the automation immediately (skips conditions)

### Script
- **Tap** — run the script
- Shows a spinner while the script is executing

### Weather
- Shows current condition icon, temperature, and a 3-day forecast row

### Media Player
- Shows album art, track title, and artist
- Play/pause, previous, next controls
- Volume slider
- Only visible when something is playing (hidden when idle/off)

### Camera
- Live snapshot refreshed every 10 seconds
- **Tap** — full-screen live stream modal (HLS or snapshot fallback)

### Calendar
- Shows next upcoming event title and time
- **Tap** — 7-day event list modal

### Person
See [Person Cards](#person-cards) below.

---

## Edit Mode

Tap the **✏️ pencil** button in the header to enter Edit Mode. All tiles start to jiggle.

<!-- ![Edit mode](docs/screenshots/edit-mode.png) -->

### Resize tiles
Drag the **resize handle** (bottom-right corner) on any tile:
- Right → wider (1→2→4 columns)
- Left → narrower
- Down → taller (2 rows)
- Up → shorter (1 row)

Supported sizes: `1×1`, `2×1`, `4×1`, `1×2`, `2×2`, `4×2`

### Reorder tiles
Drag the **grip icon** (top center) to drag tiles into a new order.

### Change icon
Tap **Icon** on any tile overlay → pick from the icon library.

### Hide a tile
Tap the **👁 eye** button to hide the tile. An **Undo** button appears in the bottom toolbar. Hidden tiles can be restored from Settings → Areas.

### Favorite an entity
Tap the **❤ heart** button to add/remove from Favorites.

### Add entity to room
Tap **+ Add** in the bottom toolbar → search and select entities to add to the current room.

### Room card background image
See [Room Card Background Images](#room-card-background-images) below.

### Done
Tap **✓ Done** in the bottom toolbar to exit Edit Mode.

---

## Settings

Tap the **⚙️ gear** icon in the header.

<!-- ![Settings panel](docs/screenshots/settings.png) -->

### Areas tab

| Action | How |
|--------|-----|
| Create custom area | Tap **+ New area** |
| Rename area | Tap the area name |
| Assign entity to different area | Tap **Move** on an entity row |
| Pick custom icon | Tap the colored icon button on any entity row |
| **Rename entity** | Tap the entity name to edit it inline — only affects this dashboard, not HA |
| Toggle favorite | Tap the ❤ heart on an entity row |
| Hide entity | Tap the 👁 eye on an entity row |
| Restore hidden entity | Tap **Restore** on a hidden entity row |

> **Entity renaming** changes the name shown on tiles and in the dashboard only. The `friendly_name` in Home Assistant is never modified. Clear the field to revert to the HA name.

### Appearance tab

| Setting | Options |
|---------|---------|
| Accent Color | Blue · Teal · Purple · Green · Amber |
| Tile Style | Glass (frosted) · Solid |
| Tile Size | Compact · Normal · Large |
| Icon Size | S · M · L |
| Tile Opacity | 10% – 100% slider |
| Background | Dark · Black · Navy · Slate |

### Browser Mod (Appearance tab)

The **Verberg HA topbar** toggle hides the white Home Assistant header bar that appears above the dashboard.

| Toggle | Effect |
|--------|--------|
| On | Hides the HA header bar — useful for kiosk / wall-panel setups |
| Off | Shows the HA header bar again |

> **Requirements:** The [Browser Mod](https://github.com/thomasloven/hass-browser_mod) integration must be installed. No helpers, automations, or `input_boolean` entities are needed — the toggle calls `browser_mod.javascript` directly.
>
> The preference is saved locally. Each time you open the dashboard it automatically re-hides the bar if the toggle is on.

---

## Sidebar

Tap the **≡ hamburger** in the header to open the sidebar.

<!-- ![Sidebar](docs/screenshots/sidebar.png) -->

The sidebar shows:
- **Time & greeting** — clock with morning/afternoon/evening greeting using your HA user name
- **Weather** — current condition and temperature (first `weather.*` entity)
- **Active devices** — count of lights on, switches on, covers open
- **Alerts** — persistent notifications from HA with dismiss button
- **Quick navigation** — tap any area to jump directly to that room

On desktop (≥1024px) the sidebar is persistent. On mobile it slides in as an overlay.

---

## Person Cards

Person tiles appear side-by-side on the Home view. Each card shows:
- Profile photo (from HA)
- Name and current zone (Home / Away / zone name)
- Distance from home (when away)
- Geocoded address

### Linking sensors

Tap the **⚙ gear** icon on a person card to configure linked sensors:

| Field | What to link |
|-------|-------------|
| Battery Level | `sensor.*_battery_level` — shows % with color indicator |
| Battery State | `sensor.*_battery_state` — charging indicator |
| WiFi Network | `sensor.*_wifi_ssid` — connected network name |
| Step Counter | `sensor.*_steps` — daily steps |
| Distance from Home | `sensor.*_distance` — km/miles display |
| Activity | `sensor.*_activity` — walking / driving / cycling badge |
| Spotify / Media | `media_player.*` — now-playing bar at the bottom |
| Geocoded Location | `sensor.*_geocoded_location` — street address from attributes |
| Ringer Mode | `sensor.*_ringer_mode` — silent / vibrate / ring indicator |

<!-- ![Person card](docs/screenshots/person-card.png) -->

---

## Room Card Background Images

You can set a custom background photo for each area card on the Home view.

1. Enter **Edit Mode** (✏️ button in header)
2. Tap **Photo** on any area card
3. Select a photo from your device
4. The image is compressed automatically and stored locally

The card applies a dark gradient overlay so text remains readable regardless of the image.

To remove a background image: enter Edit Mode and tap the **✕** button next to the photo button.

<!-- ![Room card with background](docs/screenshots/room-card-image.png) -->

---

## URL Parameters

Append these parameters to the dashboard URL for kiosk-mode or deep-linking:

| Parameter | Example | Effect |
|-----------|---------|--------|
| `?view=` | `?view=woonkamer` | Opens directly on that area (use the area_id) |
| `?menu=false` | `?menu=false` | Hides the room tab bar (for wall-mounted displays) |

---

## Screenshots

To add screenshots to this guide:

1. Take screenshots of the dashboard
2. Save them to the `docs/screenshots/` folder in this repository
3. Uncomment the `<!-- ![...] -->` image lines in this README

Suggested filenames:

```
docs/screenshots/
  home.png          ← Home view with favorites + people + room cards
  room.png          ← A room with various tiles
  edit-mode.png     ← Edit mode overlay
  light-color.png   ← Color light dialog
  thermostat.png    ← Thermostat temperature dialog
  settings.png      ← Settings panel (Areas tab)
  sidebar.png       ← Open sidebar
  person-card.png   ← Person tile with linked sensors
  room-card-image.png ← Area card with custom background photo
```

---

## Development

```bash
# Node.js proxy server (requires SUPERVISOR_TOKEN env var)
cd server && npm install
SUPERVISOR_TOKEN=your_long_lived_access_token node server.js

# React dev server (connects to localhost:3000 proxy)
cd app && npm install && npm run dev
```

The proxy at `localhost:3000` handles all HA authentication — the frontend never stores credentials directly.
