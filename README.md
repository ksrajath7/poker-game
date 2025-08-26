# ♠️ Poker Game – Real-Time Multiplayer
A full-stack poker game built with Node.js, Socket.IO, and React, featuring reconnection logic, session persistence, and smooth UI animations.

# 📦 Project Structure
```bash
apps/
├── poker-game-server     # Backend: Node.js + Socket.IO
└── poker-game-frontify   # Frontend: React + Hooks + Animations
```


# 🛠 Prerequisites
Before you begin, make sure you have:
- Node.js (v18+ recommended)
- pnpm – install globally:
```bash
npm install -g pnpm
```


# 🚀 Getting Started
1. Install Dependencies
Run this from the root of the project:
```bash
pnpm install
```

This installs all dependencies across the monorepo and links shared packages.

2. Run Backend
```bash
cd apps/poker-game-server
```
```bash
pnpm run dev
```


- Starts the backend server in development mode.
- Handles player identity, table management, and reconnection logic.

3. Run Frontend
```bash
cd apps/poker-game-frontify
```
```bash
pnpm run dev
```


- Launches the React frontend with hot reload.
- Includes animated card flips, image filters, and real-time state sync.

# ⚙️ Environment Variables
Create .env files in apps/poker-game-server.
Example:
poker-game-server/.env
PORT=5000

# 🧪 Features
- 🔄 Reconnection & Session Persistence
- 🧠 Modular Socket Event Architecture
- 🎨 Anime/Ghibli-style Image Filters
- ⚡ Real-Time Table Sync & Player State
- 💬 Custom Hooks for Feedback & Error Handling
- 🃏 Smooth UI Animations (Card Flip, Skeleton Loaders)

# 🤝 Contributing
Pull requests are welcome! For major changes, open an issue first to discuss what you’d like to improve.

# 📄 License
MIT © Rajath

Want to add a section for socket event documentation or deployment instructions next?
"# poker-game" 
