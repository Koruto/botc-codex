# Town Square (townsquare-develop) JSON Formats

This document describes the JSON structures that the [bra1n/townsquare](https://github.com/bra1n/townsquare) app **reads** and **accepts**, so that botc-codex can produce compatible output (e.g. for Load State or custom script).

---

## 1. Game State JSON (Load / Copy State)

Used in the **Game State** modal: "Copy JSON" exports this; "Load State" accepts it.

### Structure

```json
{
  "bluffs": ["role_id_1", "role_id_2", ...],
  "edition": { "id": "tb" } | { ...full edition object... },
  "roles": "" | [ ...custom role objects... ],
  "fabled": [ { "id": "fabled_id" } | { ...full fabled object... }, ... ],
  "players": [
    {
      "name": "Player name",
      "id": "player_id",
      "role": "exorcist",
      "reminders": [],
      "isVoteless": false,
      "isDead": false,
      "pronouns": ""
    }
  ]
}
```

### Fields

| Field     | Type   | Description |
|----------|--------|-------------|
| `bluffs` | `string[]` | Array of **role ids** (strings) for demon bluffs. |
| `edition` | `object` | **Official:** `{ "id": "tb" }` (or `"bmr"`, `"snv"`, `"luf"`). **Custom:** full edition object (e.g. `id`, `name`, `author`, etc.). |
| `roles` | `string` or `object[]` | **Official edition:** `""`. **Custom script:** array of custom role objects (same shape as script roles). |
| `fabled` | `object[]` | Fabled in play. Each item is `{ "id": "fabled_id" }` or a full fabled object if custom. |
| `players` | `object[]` | One object per player (see below). |

### Player object (in Game State)

| Field        | Type     | Description |
|-------------|----------|-------------|
| `name`      | `string` | Display name. |
| `id`        | `string` | Unique id (can be empty). |
| `role`      | `string` | **Role id** (e.g. `"exorcist"`, `"fool"`). Resolved against `roles` / built-in `rolesJSONbyId`. |
| `reminders` | `array`  | Reminder tokens on the player. |
| `isVoteless`| `boolean`| Whether the player is voteless. |
| `isDead`    | `boolean`| Whether the player is dead. |
| `pronouns`  | `string` | Optional. |

- On **export**, Town Square sends `role: player.role.id` (string).
- On **import**, it resolves `player.role` via `state.roles.get(player.role)` or `rolesJSONbyId.get(player.role)`.

So for botc-codex: **players must use `role` as the character/role id string** (e.g. `"exorcist"`, `"fool"`) so Town Square can resolve it.

---

## 2. Custom Script JSON (Upload / URL / Clipboard)

Used in the **Edition** modal: "Upload JSON", "Enter URL", "Use JSON from Clipboard". Same format as [Script Tool](https://script.bloodontheclocktower.com/) output (e.g. `custom-list.json`).

### Structure

**Array of role objects.** Order can matter for night order.

```json
[
  { "id": "exorcist", "name": "Exorcist", "team": "townsfolk", ... },
  { "id": "fool", "name": "Fool", "team": "townsfolk", ... },
  { "id": "_meta", "name": "My Script", "author": "...", "logo": "https://..." }
]
```

- A role can be **just a string** (the id): `"exorcist"` is treated like `{ "id": "exorcist" }`.
- Optional **`_meta`** object: script name, author, logo. Removed from the roles list and used for edition metadata.

### Role object (in script)

| Field                 | Type     | Required | Description |
|-----------------------|----------|----------|-------------|
| `id`                  | `string` | Yes      | Unique id (e.g. `"exorcist"`). |
| `name`                | `string` | Yes      | Display name. |
| `team`                | `string` | Yes      | `"townsfolk"` \| `"outsider"` \| `"minion"` \| `"demon"` \| `"traveler"` \| `"fabled"`. |
| `ability`             | `string` | Yes      | Ability text. |
| `edition`             | `string` | No       | Often `"custom"`. |
| `image`               | `string` | No       | URL to token image. |
| `firstNight`         | `number` | No       | Night order (0 = does not act). |
| `firstNightReminder` | `string` | No       | |
| `otherNight`         | `number` | No       | |
| `otherNightReminder` | `string` | No       | |
| `reminders`          | `string[]` | No     | Reminder token names. |
| `remindersGlobal`    | `string[]` | No     | |
| `setup`              | `boolean` | No      | Setup token (e.g. Drunk, Baron). |

Town Square filters roles to those with `name`, `ability`, and `team`; others are dropped.

---

## 3. Internal / Reference Data (for context only)

- **roles.json**: Full role definitions (id, name, edition, team, firstNight, otherNight, reminders, ability, etc.).
- **editions.json**: List of editions (id, name, author, description, level, roles[], isOfficial).
- **game.json**: Array of `{ townsfolk, outsider, minion, demon }` for player-count setups.
- **fabled.json** / **hatred.json**: Fabled and jinx data.

These are loaded by the app; we don't need to *produce* them for "Load State" or "custom script". We only need to produce **Game State JSON** and optionally **Custom Script JSON** in the shapes above.

---

## 4. Summary for botc-codex

To support Town Square:

1. **Game State (Load State)**  
   Emit JSON with:
   - `bluffs`: array of role id strings.
   - `edition`: `{ "id": "bmr" }` (or other official id) for standard BMR; or full edition for custom.
   - `roles`: `""` for official; or array of custom role objects for custom script.
   - `fabled`: array of `{ "id": "..." }` or full fabled objects.
   - `players`: array of `{ name, id, role, reminders, isVoteless, isDead, pronouns }` with **`role`** = character/role id string (e.g. from our ORB match: `"exorcist"`, `"fool"`).

2. **Custom Script**  
   If we ever export a script: array of role objects (and optional `_meta`), with at least `id`, `name`, `team`, `ability`; roles can be shorthand `"id"` strings.

Using the same **role id** strings as Town Square / Script Tool (e.g. lowercase, no spaces: `exorcist`, `fool`, `devilsadvocate`) ensures "Load State" and role resolution work correctly.

---

## 5. Our use case: transform into Town Square (botc-codex)

We run **extract** (detect tokens, OCR player names) then **match** (ORB → character id per token), then **transform** that into Town Square Game State JSON.

### Endpoint

- **`GET /api/grimoire/townsquare`**  
  Runs extract + match and returns **Town Square Game State** JSON. Paste it into Town Square → Menu → Game State → Load State.

### What we return

Same shape as [§ 1. Game State JSON](#1-game-state-json-load--copy-state):

| Field     | Value |
|----------|--------|
| `edition` | `{ "id": "bmr" }` (BMR only for now). |
| `roles`   | `""` (official BMR, no custom script). |
| `fabled`  | `[]` (no fabled for now). |
| `bluffs`  | **Role ids of tokens where `player_name` is null.** In a normal BMR game there are **exactly 3 bluffs** (demon bluffs). If the count is not 3, something went wrong (e.g. OCR missed names, or wrong number of tokens). |
| `players` | One entry per token **that has a player name** (OCR). Bluffs (no name) are not in `players`; only their role ids appear in `bluffs`. Each player: `name`, `id: ""`, `role` = character id from ORB, `reminders: []`, `isVoteless: false`, `isDead: false`, `pronouns: ""`. |

### Example response

```json
{
  "bluffs": ["gossip", "professor", "mastermind"],
  "edition": { "id": "bmr" },
  "roles": "",
  "fabled": [],
  "players": [
    { "name": "Alice", "id": "", "role": "exorcist", "reminders": [], "isVoteless": false, "isDead": false, "pronouns": "" },
    { "name": "Bob", "id": "", "role": "fool", "reminders": [], "isVoteless": false, "isDead": false, "pronouns": "" }
  ]
}
```

- Tokens with no OCR name → we put their **role id** in `bluffs` only; they are **not** added to `players`.
- **Bluffs count:** expect 3. If you get more or fewer, assume something went wrong (e.g. missing names, extra/missing tokens).
