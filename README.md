# 🕰️ BotC Codex

**A web app for browsing and managing Blood on the Clocktower scripts and games.**  
FastAPI backend · React + Vite frontend · TypeScript.

---

## ✨ What it is

**BotC Codex** is your **game journal**, **storyboard builder**, and **role compendium** in one place. Log sessions, track servers, scan grimoires, and never lose a night in the town square again.

---

## 🎯 What we have

|     | Feature              |                                                                                                  |
| --- | -------------------- | ------------------------------------------------------------------------------------------------ |
| 📋  | **Game journal**     | Log every session — script, roles, players, outcome. Searchable, permanent.                      |
| 📖  | **Storyboard**       | Night and day in order. Nominations, kills, dawn — replay any game as it happened.               |
| 🏛️  | **Server archive**   | All of your group’s games in one place. New players can read history before their first session. |
| 📊  | **Player chronicle** | Win rates, alignment history, most-played roles. A profile that grows with every game.           |
| 🎭  | **Role compendium**  | 200+ roles across scripts, by alignment and ability. Quick reference and first-night reminders.  |
| 📸  | **Grimoire scan**    | Photograph your grimoire. The app reads tokens and can build the final state automatically.      |

**Plus:** auth (signup/login), feedback flow, dark/light theme, responsive layout.

---

## 🛠️ Tech stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router
- **Backend:** FastAPI, Python 3.8+

---

## 🚀 Getting started

### Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**API:** `http://localhost:8000` · **Docs:** `http://localhost:8000/docs`  
Or use `./run.sh` / `run.bat` (see [backend/README.md](backend/README.md)).

### Frontend

```bash
cd client
npm install
npm run dev
```

**App:** `http://localhost:5173` (or the port Vite shows).

**Production:** `npm run build` then `npm run preview`.

---

## 📁 Project structure

```
botc-codex/
├── client/           # React + Vite frontend (TypeScript)
├── backend/          # FastAPI backend (Python)
│   ├── app/          # Application code
│   └── README.md     # Backend setup & API docs
└── README.md         # This file
```

---

## 📌 Development

- **Backend:** [backend/README.md](backend/README.md) — API endpoints, health check, troubleshooting.
- **Frontend:** `npm run lint` for ESLint.

---

## ⚠️ Disclaimer

**Not affiliated with The Pandemonium Institute.**  
Blood on the Clocktower is a trademark of The Pandemonium Institute.
