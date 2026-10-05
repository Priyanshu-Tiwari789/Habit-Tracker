# HabitFlow — Personal Habit & Productivity Planner

> A Notion-inspired personal habit tracker, timetable planner, and consistency dashboard built with pure HTML5, CSS3, and Vanilla JavaScript.

🌐 **Live Demo:** [https://habit-tracker-six-teal.vercel.app](https://habit-tracker-six-teal.vercel.app)

![HabitFlow Preview](https://raw.githubusercontent.com/placeholder/preview.png)

---

## 🌟 Overview

**HabitFlow** combines the flexibility and clean aesthetics of Notion with an actionable, everyday productivity system. It gives you a complete cockpit for your daily habits, schedule, milestones, hobbies, and personal growth — all stored locally on your device with zero tracking and zero server dependencies.

---

## ✨ Features

### 1. 📅 Interactive Timetable & Daily Schedule
- Plan your day block-by-block with time slots and categories (Health, Work, Fitness, Personal).
- One-click task completion with visual strikethrough and progress metrics.
- Add notes and reminders to any time block.

### 2. ✅ Habits to Build & Consistency Tracking
- Track positive daily or weekly habits with streaks (Current Streak and Best Streak).
- Visual progress bar for each habit.
- Filter by category and search dynamically.

### 3. 🚫 Habits to Quit (Sobriety / Abstinence Counter)
- Track habits you want to break (e.g., late-night screen time, junk food).
- Automatic day counter since quit date.
- Relapse logger to record slip-ups without losing heart, showing total clean days and recovery streaks.

### 4. 🎯 Daily Checkpoints
- Structured checkpoints for Morning 🌅, Midday ☀️, and Evening 🌙 routines.
- Check off key micro-habits throughout the day.

### 5. 🎨 Hobbies & Commitment Video Vault
- Embark on new creative hobbies (e.g., Guitar, Oil Painting, Coding).
- **Personal Oath**: Write your commitment statement and target completion milestone.
- **Video Vault**: Upload or record a personal commitment video directly via your webcam and store it locally using IndexedDB.

### 6. 📊 Analytics & Progress
- Weekly completion rate bar chart with custom canvas rendering.
- Best overall streak and average daily scores.
- Category breakdown and habit consistency distribution.

### 7. 🗓️ Visual Calendar (Bright vs. Dull Days)
- **Bright Glowing Green (`🌟 80%+`)**: Celebrates high-achievement days with glowing emerald badges.
- **Fresh Mint (`✓ 60-79%`)**: Good consistent days.
- **Soft Amber (`35-59%`)**: Partial progress days.
- **Dull Muted Slate (`⚪ <35% / Missed`)**: Incomplete or inactive days rendered in faded, low-contrast slate to clearly contrast accomplishments.
- **7-Day Dashboard Flow**: A quick-glance strip on the dashboard to track your week's momentum.

### 8. 🤖 Interactive Mascot Buddy
- A friendly kawaii cartoon productivity companion sitting quietly in the bottom-right corner.
- **Typing Reaction**: Bobs up and down with animated typing hands whenever you type into notes or inputs.
- **Celebration Reaction**: Jumps with star bursts and cheer messages whenever you complete a habit or check off a task.
- **Idle Motion**: Floating breath animation with natural eye-blinking.
- **Minimize Toggle**: Click the snooze button (`✕` / `🤖`) anytime for distraction-free focus.

### 9. 👤 Personalization & Nicknames
- Friendly first-run onboarding to set your preferred nickname.
- Emoji avatar picker with 14 customized styles.
- Quick 1-click edit directly from the Dashboard greeting or sidebar user chip.

### 10. 🔒 100% Local & Private
- All habit data is stored in your browser's `localStorage`.
- Video recordings are persisted safely via `IndexedDB`.
- Complete JSON export and import for seamless backups and device migrations.

---

## 🚀 Quick Start

No installation or build steps required!

1. Clone or download this repository.
2. Open `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari).

Or serve it locally using any static web server:

```bash
# Using Python
python -m http.server 3000

# Using Node.js
npx serve .
```

Open `http://localhost:3000` in your browser.

---

## 📁 Project Structure

```
habit-tracker/
├── index.html        # Main single-page application structure & modals
├── style.css         # Modern design system, themes, keyframes & responsive layouts
├── script.js         # State management, calendar logic, charts & mascot system
├── vercel.json       # Vercel deployment configuration
└── README.md         # Documentation & guide
```

---

## ☁️ Deploying to Vercel

### Option 1: Via Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Option 2: Via GitHub Integration
1. Push this repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Framework Preset: **Other** (Root directory: `./`).
5. Click **Deploy**!

---

## 🛠️ Tech Stack

- **HTML5**: Semantic tags, accessible modals, SVG icons.
- **CSS3**: CSS Custom Properties (Light/Dark themes), Flexbox/Grid, CSS Keyframe Animations.
- **Vanilla JavaScript (ES6+)**: `localStorage`, `IndexedDB`, Canvas API, MediaStream Recording API.

---

## 📄 License

MIT License — Feel free to use, modify, and build upon this project for your personal productivity.
