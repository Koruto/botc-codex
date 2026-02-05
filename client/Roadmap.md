# BotC Codex

Blood on the Clocktower grimoire parser and story viewer. Upload grimoire images, get parsed state and Town Square JSON, then save and share games with a scroll-driven narrative experience.

---

## Getting started

### Client (frontend)

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). You’ll see the dashboard; use the nav to open Login, Profile, and sample Server/Game pages.

### Backend

See backend docs for API and pipeline. Frontend will call it in Part 1.

---

## Project structure

```
botc-codex/
├── client/                 # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── components/     # Layout, shared UI
│   │   │   ├── Layout.tsx
│   │   │   └── index.ts
│   │   ├── pages/         # Route-level pages (dummy content for now)
│   │   │   ├── HomePage.tsx      # Dashboard, servers, recent games
│   │   │   ├── LoginPage.tsx     # Sign in / sign up
│   │   │   ├── ServerPage.tsx    # Games list for a server
│   │   │   ├── GamePage.tsx      # Single game (timeline + grimoire)
│   │   │   ├── AddGamePage.tsx   # Upload grimoire, add game (admin)
│   │   │   ├── ProfilePage.tsx   # Account & settings
│   │   │   └── index.ts
│   │   ├── App.tsx        # Router and routes
│   │   ├── main.tsx       # Entry point
│   │   └── index.css      # Global + Tailwind
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── README.md              # This file
└── (backend when present)
```

Routes:

| Path                         | Page                       |
| ---------------------------- | -------------------------- |
| `/`                          | Home / Dashboard           |
| `/login`                     | Login / Sign up            |
| `/server/:serverId`          | Server game list           |
| `/game/:gameId`              | Game (timeline + grimoire) |
| `/server/:serverId/add-game` | Add game (admin)           |
| `/profile`                   | Profile & settings         |

---

## Features

**Done**

- Upload grimoire image(s) via folder → API runs pipeline (circle detect, crop tokens, OCR names, ORB character match, dead from `-dead` refs).
- Return raw parse (token, player_name, character, is_dead, confidence).
- Return Town Square Load State JSON (paste into Town Square).
- Extract-only and match-only endpoints.
- Stable token order (top, then clockwise).
- API docs at `/docs`.

**Possible**

- Frontend: upload image in browser → call API → show result + copy Town Square JSON.
- Persist games: save each run (state + optional image) with date/script/player count.
- Library UI: list saved games, open one to view state and JSON, filter by date/script.
- Multiple editions/scripts (more ref-images, non-BMR).
- Stronger preprocessing and error handling.

---

## Fully complete when

- [ ] Frontend: user can upload a grimoire image and see parsed result (players, roles, dead) and Town Square JSON.
- [ ] Each run can be saved as a “game” (state + metadata).
- [ ] User can list saved games and open one to view its state and JSON.
- [ ] Backend supports list/get (and optional search) for saved games.

---

## Implementation order

Break the work into parts and do them in this order. Tick items as you go.

**Part 1 — Use the API from the browser (no auth, no save)**  
_Goal: Upload a photo in the frontend and see the parsed result._

- [ ] Backend: Add an endpoint that accepts an image upload (e.g. `POST /api/grimoire/process` with multipart file), runs the existing pipeline, returns parse + Town Square JSON. No persistence yet.
- [ ] Frontend: One page with upload (drag-and-drop or file picker), loading state, then result: players (name, role, alive/dead), bluffs, and a “Copy Town Square JSON” button.

**Part 2 — Save and open games (library, still no auth)**  
_Goal: After processing, user can save a game and later see a list and open one._

- [ ] Backend: `POST /api/games` (body: parsed state + metadata + optional image), `GET /api/games` (list), `GET /api/games/:id` (one game). Store in DB or file-based. No auth yet — e.g. one global list or keyed by session/device.
- [ ] Frontend: After result screen, “Save to library” button; “Library” page with list of saved games (date, script, player count); click a game → detail page (same result view + copy JSON, optional saved image).

**Part 3 — Auth**  
_Goal: Users have accounts; later we can tie games/servers to them._

- [ ] Backend: Sign up, login, session or JWT; “who am I” endpoint; optionally “my games” filtered by user.
- [ ] Frontend: Login / sign up page; protect “Save to library” and “Library” (or show “log in to save”); user menu (logout). Games are owned by the logged-in user.

**Part 4 — Servers (game groups) and roles**  
_Goal: Users join servers; admins add/manage games, viewers only open and view._

- [ ] Backend: Servers (create, list, join by code or invite link); membership with role (admin vs viewer); games belong to a server; list games per server; permissions (only admin can add/edit/remove games).
- [ ] Frontend: Home = list of my servers + “Join server”; Server page = list of games (their games + teensy/linked if you have them). Admin: “Add game,” “Edit,” “Remove.” Viewer: only open game. “Add game” = upload → process → save to this server (reuse Part 1 + 2 flow).

**Part 5 — Game page: shareable link and narrative**  
_Goal: One URL per game; then scroll = timeline; then POV._

- [ ] **5a — Static game page:** Shareable link (e.g. `/game/:id`). Page shows: grimoire image (top right), result (players, roles, dead, bluffs), “Copy Town Square JSON.” One state, one image. No scroll yet.
- [ ] **5b — Timeline and scroll:** Backend: store “beats” per game (e.g. Day 1, Night 1, event text, grimoire state or image per beat). Admin can add/edit timeline when adding a game or in “Edit game.” Frontend: scroll drives which beat is active; grimoire and main area update per beat (scroll = time).
- [ ] **5c — POV:** POV selector (Omniscient vs Alice, Bob, …). For each beat, store or derive “what does each player know.” Frontend: in POV mode, show only that player’s knowledge at each beat; reveal gradually as they scroll.

**Part 6 — Storytelling polish**  
_Goal: Pre-game, key moments, navigation, end reveal._

- [ ] Pre-game card (script, date, players) and optional “Night zero” beat before Day 1.
- [ ] Stronger beats: death/role reveal lines, nomination scenes; grimoire update callouts.
- [ ] Timeline scrubber (click to jump to a day/night) and “Jump to key moment” (first execution, final day, etc.).
- [ ] Grim reveal at end: full grimoire + outcome (Good/Evil wins), clear and readable.
- [ ] Recap (“In 3 sentences”), optional storyteller/player notes, “Discuss this game” link.
- [ ] Optional: subtle sound, player avatars/names, Evil team POV.

**Quick reference**

| Part | What you get                                                      |
| ---- | ----------------------------------------------------------------- |
| 1    | Upload in browser → see result + copy Town Square                 |
| 2    | Save game → Library list → open game (detail)                     |
| 3    | Login; games tied to user                                         |
| 4    | Servers; admin adds games, viewer views; game list per server     |
| 5a   | Game page with shareable link (static grim + result)              |
| 5b   | Timeline data; scroll = story; grimoire updates                   |
| 5c   | POV: view as one player, info revealed over scroll                |
| 6    | Pre-game, scrubber, grim reveal, recap, notes, optional sound/POV |

---

## Product: what the user sees

### Auth and servers

- **Login:** Users sign up / log in. Everything is per-account.
- **Servers (game groups):** Users join servers (e.g. “Tuesday group,” “League X”). Each server has a list of games.
- **Roles on a server:**
  - **Viewer (non-admin):** Can only open and view games. No add/edit/delete.
  - **Admin:** Can add new games (e.g. upload grimoire + parse, or link external), edit metadata, remove games.
- **Game list on a server:** User sees “their games” (games they’re part of or have access to) and “teensy games” (or linked/external games, depending on how you define it). Each game is one row/card.
- **Opening a game:** Clicking a game opens a **shareable link** to that game (e.g. `/game/abc123`). Anyone with the link and permission can open it.

---

### Game page: dynamic, scroll-driven experience

The game page is **not** a static image. It’s a narrative that unfolds as you scroll.

**Layout**

- **Top right (sticky or fixed):** The **grimoire** for the current moment in the story. It updates as you scroll.
- **Main area (scroll):** A vertical timeline of what happened in the game. As you **scroll slowly**, the story advances: day/night, events, nominations, votes, executions. The grimoire in the corner updates to match that point in time (who’s dead, who’s alive, tokens flipped).

**Content as you scroll**

- Short, clear lines per “beat”: e.g. “Night 1 – Empath got 2,” “Day 1 – Alice nominated Bob – 4 votes – executed,” “Grimoire updated.”
- Optional: who used an ability, who nominated whom, vote counts, which nomination won, death. The grimoire image (or state) changes at the right moments (e.g. after an execution, after a night).

- When nomination happens, show in grimoire like the clock icon if needed, or only for exe that passes

**POV (point of view)**

- User can switch to a **specific player’s POV** (e.g. “View as Alice”).
- In POV mode, the main area shows only what **that player** would know: their role, their night info (if any), public events (nominations, votes, deaths). Other players’ roles and private info are hidden or blurred until “revealed” by the narrative (e.g. on execution or at game end).
- Information is revealed **gradually** as you scroll, so it feels like reliving the game from that player’s perspective.

**End of game**

- When the scroll reaches game end, it becomes a **grim reveal**: the full grimoire (and optionally all roles) is revealed in a clear, satisfying way (e.g. full-screen grimoire, optional simple animation, “Good wins” / “Evil wins”).

**Summary**

- One page per game, with a **shareable link**.
- **Scroll = time.** Grimoire top right, timeline in the main area. Events in short form; grimoire state updates in sync.
- **POV selector:** Watch as a specific player; only their knowledge, revealed step by step.
- **End:** Grim reveal, full grimoire, clear outcome.

---

### How to make it more perfect

- **Clear structure:** Explicit “Day 1,” “Night 1,” “Day 2,” etc. and maybe a progress indicator (e.g. “You’re at Day 2” or a mini timeline).
- **Tooltips / glossary:** Hover or tap on role names, abilities, or terms to see a one-line reminder (good for newer players).
- **Share and permissions:** Share link with “view only” vs “can share” so groups can pass the link safely.
- **Mobile:** Same scroll narrative; grimoire could be collapsible or move to top on small screens so the timeline stays readable.
- **Accessibility:** Optional “reduce motion,” keyboard nav, and enough contrast so day/night and text are readable.
- **Export:** At the end, optional “Download grim as image” or “Copy Town Square JSON” for that final state.
- **Replay controls (later):** Optional “Play” that auto-scrolls at a set speed, or “Jump to Day 3” for power users.

---

### Pages and structure

| Page                        | Purpose                                                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Login / Sign up**         | Auth; redirect to home or last server.                                                                                        |
| **Home / Dashboard**        | List of servers the user is in; “Join server” (code or invite link); maybe “Recent games” across servers.                     |
| **Server**                  | List of games (their games + teensy/linked games). Admin: “Add game,” “Edit,” “Remove.” Click game → Game page.               |
| **Game**                    | Single game: scroll-driven timeline + grimoire (top right), POV selector, grim reveal at end. Shareable URL.                  |
| **Add / Edit game** (admin) | Upload grimoire image → process → preview result → name/label/date → save to server. Or link external game if you support it. |
| **Profile / Settings**      | Account (email, password), notifications (if any), maybe default POV or display preferences.                                  |

---

### Design scheme

- **Vibe:** Suits BotC: slightly dark or moody (e.g. dark background, warm or muted accents), but **readable**. Not full “horror”; more “board game night.”
- **Hierarchy:** Timeline is the main focus; grimoire is supporting. Use typography (size, weight) so “Day 2” and event lines are scannable. One primary accent color (e.g. for “nomination,” “executed,” “grimoire updated”).
- **Grimoire:** Always visible in its slot (top right or top on mobile). Smooth update when state changes (crossfade or short transition so it doesn’t feel jumpy).
- **POV:** Clear control (dropdown or tabs): “Omniscient” vs “Alice,” “Bob,” … so switching feels intentional.
- **Grim reveal:** Full-bleed or full-screen grimoire at the end; optional subtle zoom or fade-in. Outcome (Good/Evil wins) in clear type.
- **Consistency:** Same header/sidebar across Server and Game (back to server, server name, user menu) so it never feels lost.

Suggestion: Link permission levels

Public: Anyone with link can view (default)
Server-only: Must be member of that server
Private: Only specific users (whitelist)

---

### Storytelling & features to consider

Product-only: what would make the _story_ of each game richer and more useful.

**Before the scroll (set the stage)**

- **Pre-game card:** Script name, date played, player count, optional storyteller. One screen or collapsible: “Trouble Brewing, 7 players, 1 Feb 2025.” Then “Begin” or scroll starts.
- **Night zero:** Optional beat before Day 1: “The grimoire is set.” Static grim or one frame. Builds anticipation.

**Stronger beats as you scroll**

- **Deaths with impact:** Not only “Bob executed” but “Bob (Washerwoman) executed — Good loses a vote” or “Alice killed at night.” Role + consequence in one line.
- **Nominations as scenes:** Who nominated whom, votes for/against, outcome, then “Grimoire updated.” Each nomination feels like a clear beat.
- **Role reveal moment:** When someone is executed or revealed, a dedicated beat: “Bob was the Washerwoman” with a small role card or tooltip. Same for demon/minions at game end.
- **Reminders (if you have data):** “Empath has ‘Poisoned’ reminder,” “Fool’s ability triggered.” Adds texture without clutter.

**POV and perspective**

- **Evil team POV:** Option to “View as Evil” — what minions/demon knew (who’s who, bluffs). Different from single-player POV; good for post-game discussion.
- **Night vs day in POV:** In player POV, nights show only what that player sees: “You were attacked,” “You learned 2,” “No info.” Keeps the story coherent for that perspective.

**Navigation and pacing**

- **Timeline scrubber:** Mini timeline (e.g. dots or segments per day) beside or below the scroll. Click to jump to Day 2 / Night 3. Scroll position highlights current segment. “Where am I in the story” at a glance.
- **Jump to key moments:** Links or buttons: “First execution,” “Demon kill Night 2,” “Final day.” Lets people replay the dramatic beats without scrolling the whole thing.
- **Pause at big moments:** Optional: before an execution reveal, a line like “Bob’s token flips…” then next scroll = role + grimoire update. Or a subtle divider “——— Day 2 ———” so nights/days feel distinct.

**After the game**

- **Short recap:** At the end, “In 3 sentences”: e.g. “Good won Day 4 when the Demon was executed after the Empath’s info.” For people who want the outcome without rewatching.
- **Storyteller or player notes:** If admins/players can add a line or two (“Alice’s first game,” “Chaos at final 3”), show them at the top or end. Makes the library feel personal.
- **Discuss / share:** “Discuss this game” → link to Discord or a simple thread. Or “Share your POV” so players can add a short take. Community storytelling.

**Atmosphere (optional)**

- **Sound:** Very subtle: different ambience for night vs day, or a single tone on death. Can be off by default.
- **Player avatars/names:** Consistent small avatar or name for each player so you follow “Alice” and “Bob” through the scroll. Helps in long games.

**Summary**  
Add: pre-game card and night zero, death/role-reveal beats, nomination scenes, Evil POV, timeline scrubber and “jump to moment,” recap and optional notes, optional sound and avatars. All of this supports the same goal: the game feels like a story you can relive, skip through, or share.
