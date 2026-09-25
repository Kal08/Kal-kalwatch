# WatchTogether 💖

A synchronized YouTube watch party web app designed specifically for long-distance couples. Watch YouTube videos together in real-time — when the host plays, pauses, or seeks, the partner's screen stays frame-synced instantly.

---

## Features

- **Real-Time Video Sync**: Millisecond-accurate playback synchronization powered by Node.js, Express, and Socket.IO.
- **Host-Controlled Playback**: The first partner to create the room is the **Host**, with exclusive playback controls to keep both screens in lockstep without control fights.
- **Instant Video Loading**: Either partner can paste any YouTube URL (standard links, `youtu.be`, shorts, or video IDs) or choose from curated couple suggestions.
- **Couple Presences & Status**: Live connection indicator displaying "Waiting for partner..." or "Connected with [Name] 💖".
- **Sweet Floating Reactions & Chat**: Send animated floating hearts (💖, 🥰, 🍿, 🥺) and quick whispers without cluttering the screen.
- **Graceful Failover & Reconnect**: If the host leaves, the partner is automatically promoted to host. If a user refreshes their browser, they rejoin seamlessly with their room code.
- **Autoplay Handling**: Built-in prompt to gracefully bypass strict browser audio policies with a single tap.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide icons
- **Backend**: Node.js, Express, Socket.IO
- **Video Engine**: Official YouTube IFrame Player API (`YT.Player`)
- **Storage**: In-memory server room state (no database required for MVP)

---

## How to Run Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application runs on `http://localhost:3000`.

3. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

---

## How to Test with Two Browser Tabs

1. **Open Tab 1 (Host)**:
   - Navigate to `http://localhost:3000`
   - Click **"Create Room"**, enter your name (e.g., *"Alex"*), and click **"Generate Room Code"**
   - Copy the 6-character room code (e.g., `AB3X9Q`)
   - Click **"Enter Watch Room"**

2. **Open Tab 2 (Partner / Incognito Window)**:
   - Open a new tab or incognito browser window at `http://localhost:3000`
   - Click **"Join Room"**, enter your partner's name (e.g., *"Taylor"*), and paste the 6-character code
   - Click **"Enter Watch Room"**

3. **Observe the Real-Time Sync**:
   - Both tabs will update their status to **"Connected with [Partner Name] 💖"**.
   - In **Tab 1 (Host)**, press **Play**, **Pause**, or drag the **Seek Bar**.
   - Notice that **Tab 2 (Partner)** instantly mirrors the exact timestamp and playback state.
   - In **Tab 2 (Partner)**, paste a new YouTube URL or click a quick suggestion — both players immediately load the new video together.
   - Send floating heart reactions or chat messages and watch them float on both screens in real time.
