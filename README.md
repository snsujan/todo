# ⚡ Abdul Kader Workspace Pro (v2.0)

A sleek, state-of-the-art productivity suite and task management application built with **Node.js**, **Vanilla JavaScript (ES6+)**, and modern **Glassmorphism CSS design system**. 

Features an **AI Smart Quick-Parser**, **Drag-and-Drop Kanban Board**, **Nested Subtask Checklists**, **Productivity Daily Streak Tracker**, **Gamified Celebrations**, and **Dual Persistence (REST API + Offline LocalStorage Fallback)**.

---

## ✨ Key Features

### 1. 📊 Interactive Kanban Board & List View Switcher
- **Dual View Mode**: Switch seamlessly between **List View** and a 3-column **Kanban Board** (*To Do*, *In Progress*, *Done*).
- **Drag-and-Drop**: Drag task cards between columns to update status dynamically.

### 2. ✨ AI Smart Quick-Parser
- **Natural Language Parsing**: As you type into the main input box (e.g., `"Call client tomorrow at 3pm high priority"`), the AI parser automatically detects and fills:
  - 📅 **Due Date** (`today`, `tomorrow`, `next week`, specific dates)
  - 🚩 **Priority** (`high priority` 🔥, `medium` ⚡, `low` 🌱)
  - 🏷️ **Category** (`Work`, `Personal`, `Shopping`, `Wellness`, `Finance`)

### 3. 📋 Subtasks & Dynamic Progress Bars
- **Checklist Support**: Create nested subtasks inside any task card.
- **Dynamic Mini Progress Bar**: Real-time progress bar showing completed subtasks percentage (e.g. `2/4 subtasks (50%)`).

### 4. 🔥 Productivity Streak Tracker & Level Badges
- **Daily Streak Counter**: Tracks consecutive active days of completing tasks (`🔥 5 Day Streak`).
- **Productivity Level Badge**: Automatically awards titles as you complete tasks:
  - `🌱 Novice Achiever` (0-4 tasks)
  - `⚡ Productivity Pro` (5-14 tasks)
  - `🔥 Task Master` (15-29 tasks)
  - `👑 Workforce Legend` (30+ tasks)

### 5. 🔊 Sound FX & Confetti Particle Celebrations
- **Web Audio Synthesizer**: Plays a 3-note harmonic chime (C5 $\rightarrow$ E5 $\rightarrow$ G5) when completing tasks.
- **Confetti Explosion**: Fires celebratory confetti particles across the screen.
- **XP Popups**: Spawns floating `+50 XP ✨` notification badges on completed task cards.
- **Sound Toggle**: Speaker icon in the header allows muting/unmuting sound FX anytime.

### 6. ⚡ Dual Persistence Engine
- **REST API Backend**: Fast Node.js server storing data in `todos.json`.
- **LocalStorage Fallback**: Operates 100% offline or as a static site if the backend server is unreachable.

---

## 🛠️ Technology Stack

- **Backend**: Node.js, REST API (`server.js`)
- **Frontend**: HTML5, Vanilla JavaScript (ES6+), Modern Vanilla CSS3
- **Design System**: Glassmorphism, HSL tailwind color palettes, Inter & Outfit Google Fonts
- **Libraries**: Lucide Icons CDN, Canvas Confetti Engine CDN

---

## 🚀 Quick Start (Local Installation)

### Prerequisites
Make sure you have **Node.js** installed on your system.

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/snsujan/todo.git
   cd todo
   ```

2. **Start the application**:
   ```bash
   npm start
   ```

3. **Open in your browser**:
   - **Local Link**: [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deploying to the Web (24/7 Free Hosting)

### Deploy to Render
1. Push your repository to GitHub:
   ```bash
   git remote add origin https://github.com/snsujan/todo.git
   git branch -M main
   git push -u origin main
   ```
2. Go to [dashboard.render.com](https://dashboard.render.com) $\rightarrow$ **New +** $\rightarrow$ **Web Service**.
3. Connect repository **`snsujan/todo`**.
4. Set **Build Command**: `npm install` and **Start Command**: `npm start`.
5. Click **Create Web Service**.

---

## 👤 Author

**Abdul Kader**  
- Workspace: **Abdul Kader Workspace Pro**  
- GitHub: [@snsujan](https://github.com/snsujan)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
