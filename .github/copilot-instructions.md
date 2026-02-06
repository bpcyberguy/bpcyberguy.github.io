# Conflux: Metathesiophobia Codebase Guide

## Project Overview
This is a static GitHub Pages site for a D&D campaign ("The Conflux: Metathesiophobia") featuring client-side authentication, progressive content unlocking, and ARG (Alternate Reality Game) mechanics. All logic runs in the browser; there is no backend server.

## Architecture & Data Flow

### Authentication & Sessions (`js/auth.js`)
- **Session storage**: localStorage key `conflux_session_v1` holds `{playerId, name, role, ts}`
- **Authentication flow**: Players enter ID (format: `Name123456`) → lookup in `data/players.json` → session created
- **Roles**: "player" (default) or "dm" (via `elevateToDM()` with SHA256 passphrase verification against `db.dm.passphraseHash`)
- **Theme system**: Two CSS themes toggle via localStorage `conflux_theme_v1` ("metathesiophobia" | "diagnostic"), loaded with smart relative paths
- **Unlock flags**: localStorage `conflux_unlocks_v1` stores unlocked lore flags as JSON array

### Lore & Progressive Unlocking (`js/lore.js` + `data/lore.json`)
- Each entry has: `{id, title, flag, required[], content, unlockCodeHash?}`
- **Prerequisites**: Entry X requires entry Y's flag to be visible (e.g., lore_danse requires lore_intro)
- **Unlock mechanism**: Player submits code → SHA256 hash → match against `unlockCodeHash` → sets flag in unlock list
- **Rendering**: Visible entries show content; locked entries show `[LOCKED] Authorization required.`

### ARG & Diagnostics (`js/arg.js`)
- **Keybind**: Ctrl+Shift+L toggles diagnostics overlay
- **Hidden content**: `[data-fragment]` DOM attributes contain base64-encoded text (decoded on overlay open)
- **Overlay displays**: Fragment count, decoded fragments, current unlock flags, mysteries
- **Purpose**: Layered mystery—hints scattered in DOM for engaged players

### Character Progress (`js/auth.js` + `characters/*.html`)
- **Storage key**: localStorage `conflux_character_saves_v1` stores per-player saves: `{playerId: {characterId: {inventory[], notes, lastUpdated}}}`
- **API**: `ConfluxAuth.loadCharacterProgress(characterId)` and `ConfluxAuth.saveCharacterProgress(characterId, {inventory, notes})`
- **Scope**: Per-browser, per-device only (no cross-device sync)
- **Character sheet pattern**: Each character page (maddie.html, joe.html, etc.) has 12 inventory slots (text inputs) + notes textarea
- **Save behavior**: Auto-save on field blur + explicit "Save Progress" button; displays timestamp confirmation

## Key Conventions & Patterns

### Player & Data Structure
- **players.json**: Maps `userId` → `{name, characterPath}` (e.g., "Maddie24601" → Alpha)
- **DM entry**: Special object with `passphraseHint` and `passphraseHash` (SHA256) for DM elevation
- **IDs in UI**: Always in format `Name+Number` (e.g., "Joseph2714")

### Path Handling
All pages detect depth via `location.pathname.split("/").filter(Boolean).length > 1`:
- Nested pages (e.g., `/home/index.html`) use `../` relative paths
- Root pages (e.g., `/index.html`) use direct paths
- Theme stylesheet loads dynamically with correct relative path

### Authentication Guards
Pages requiring auth call `ConfluxAuth.requireAuthOrRedirect(fallbackPath)` at load:
- If no session → redirect to login
- If session exists → page renders with user context
- Example: `home/index.html` redirects to `../index.html` if unauthenticated

### Cache Policy
All data fetches use `cache: "no-store"` to ensure fresh player/lore data:
```javascript
const res = await fetch("data/players.json", { cache: "no-store" });
```

## File Structure & Responsibilities

| Path | Purpose |
|------|---------|
| `index.html` | Login page; handles player ID entry and theme selection |
| `home/index.html` | Authenticated dashboard; displays player name |
| `characters/` | Player character sheet pages (maddie.html, joe.html, etc.) |
| `lore/index.html` | Progressive lore viewer with unlock code input |
| `dm/index.html` | DM dashboard (requires elevated role) |
| `data/players.json` | Player registry and DM credentials |
| `data/lore.json` | Campaign lore entries with prerequisites and unlock hashes |
| `css/base.css` | Core styles (layout, typography, form fields) |
| `css/themes/` | Switchable theme stylesheets |
| `js/auth.js` | Session & unlock management; theme switching |
| `js/app.js` | General page init logic |
| `js/arg.js` | Diagnostics overlay and fragment scanning |
| `js/lore.js` | Lore rendering and unlock submission |

## Common Tasks

### Adding a Lore Entry
1. Add entry to `data/lore.json` with `{id, title, flag, required[], content, unlockCodeHash?}`
2. To make unlockable: generate SHA256 hash of unlock code, set as `unlockCodeHash`
3. Ensure all `required` flags exist as lore entries
4. Test with DM console in diagnostics mode (Ctrl+Shift+L)

### Adding a Player
1. Add to `data/players.json` under "players": `"UserId": {name: "playerName", characterPath: "..."}`
2. Player can now login with that ID
3. Ensure characterPath points to valid character page

### Hiding Content (ARG)
Use `data-fragment="base64-encoded-text"` on any HTML element:
```html
<p data-fragment="VGhpcyBpcyBoaWRkZW4=">Visible text</p>
```
Open diagnostics (Ctrl+Shift+L) to reveal decoded fragments.

### Switching Themes
Theme applies to all pages; controlled by `ConfluxAuth.setTheme("diagnostic")` or dropdown on login.
Styles in `css/themes/diagnostics.css` vs `css/themes/metathesiophobia.css`.

### Saving Character Progress
Character sheets (characters/*.html) auto-save inventory (12 slots) and notes to localStorage:
1. Update inventory slots (text inputs) and notes textarea
2. Save triggers on field blur or explicit "Save Progress" button click
3. Data persists in `conflux_character_saves_v1` by player ID + character file name
4. Load saved data on page init via `ConfluxAuth.loadCharacterProgress(characterId)`
5. **Per-device only**: Progress is local to browser/device; logging in elsewhere starts fresh

## Testing & Debugging

- **No build step**: Open `index.html` directly in browser (or via local server for proper paths)
- **Browser console**: Check localStorage (`ConfluxAuth.getSession()`, etc.)
- **Diagnostics**: Press Ctrl+Shift+L to reveal hidden fragments and unlock status
- **Cache bypass**: Use DevTools cache disable or `cache: "no-store"` in all fetches

## Security Considerations
⚠️ **Client-side only**: This is a puzzle/mystery site, not secure infrastructure. Passphrases and unlock codes are visible in JSON and browser memory. Design for fun, not privacy.

## Development Notes
- No npm/build; pure HTML/CSS/JS
- All state in localStorage; reload behavior is stable ("no-store" cache policy)
- Relative path detection is critical for nested page functionality
- Theme switching requires ID `themeStylesheet` link element present
