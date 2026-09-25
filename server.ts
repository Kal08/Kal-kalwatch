import express from 'express';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import path from 'path';
import { createServer as createViteServer } from 'vite';

interface RoomUser {
  id: string; // socket.id
  name: string;
  isHost: boolean;
  joinedAt: number;
}

interface Room {
  code: string;
  hostId: string;
  users: RoomUser[];
  currentVideoId: string;
  currentTime: number;
  isPlaying: boolean;
  lastUpdated: number;
}

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Set up Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(express.json());

// In-memory room store: roomCode -> Room
const rooms = new Map<string, Room>();

// Helper to generate a friendly 6-character room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // If collision, generate another
  if (rooms.has(code)) {
    return generateRoomCode();
  }
  return code;
}

// Clean up stale empty rooms older than 2 hours periodically
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (room.users.length === 0 && now - room.lastUpdated > 2 * 60 * 60 * 1000) {
      rooms.delete(code);
    }
  }
}, 10 * 60 * 1000);

// API routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    activeRooms: rooms.size,
    timestamp: new Date().toISOString(),
  });
});

// Check if room exists before joining
app.get('/api/room/:code', (req, res) => {
  const code = (req.params.code || '').toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ exists: false, message: 'Room not found' });
  }
  res.json({
    exists: true,
    userCount: room.users.length,
    currentVideoId: room.currentVideoId,
  });
});

// Socket.IO connection handling
io.on('connection', (socket: Socket) => {
  let currentRoomCode: string | null = null;
  let userName: string = 'Anonymous';

  // 1. Create Room
  socket.on('create-room', ({ name }: { name: string }, callback?: (res: any) => void) => {
    const cleanName = (name || 'Partner').trim().slice(0, 24);
    userName = cleanName;
    const roomCode = generateRoomCode();
    currentRoomCode = roomCode;

    const hostUser: RoomUser = {
      id: socket.id,
      name: cleanName,
      isHost: true,
      joinedAt: Date.now(),
    };

    const newRoom: Room = {
      code: roomCode,
      hostId: socket.id,
      users: [hostUser],
      currentVideoId: 'LXb3EKWsInQ', // Beautiful 4K Costa Rica nature starter video
      currentTime: 0,
      isPlaying: false,
      lastUpdated: Date.now(),
    };

    rooms.set(roomCode, newRoom);
    socket.join(roomCode);

    const payload = {
      roomCode,
      users: newRoom.users,
      hostId: newRoom.hostId,
      currentVideoId: newRoom.currentVideoId,
      currentTime: newRoom.currentTime,
      isPlaying: newRoom.isPlaying,
    };

    socket.emit('room-joined', payload);
    if (typeof callback === 'function') {
      callback({ success: true, roomCode });
    }
  });

  // 2. Join Room
  socket.on('join-room', ({ name, roomCode }: { name: string; roomCode: string }, callback?: (res: any) => void) => {
    const code = (roomCode || '').trim().toUpperCase();
    const cleanName = (name || 'Partner').trim().slice(0, 24);
    userName = cleanName;

    const room = rooms.get(code);
    if (!room) {
      socket.emit('error-message', {
        message: `Room "${code}" does not exist. Please double-check your 6-character code or create a new room!`,
      });
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Room not found' });
      }
      return;
    }

    currentRoomCode = code;
    socket.join(code);

    // Check if user is reconnecting with the same name or previous host
    const existingIndex = room.users.findIndex(
      (u) => u.id === socket.id || (u.name.toLowerCase() === cleanName.toLowerCase() && u.name === cleanName)
    );

    let newUser: RoomUser;
    if (existingIndex !== -1) {
      // Reconnected user
      const wasHost = room.users[existingIndex].isHost;
      room.users[existingIndex].id = socket.id;
      if (wasHost || room.users.length === 1) {
        room.hostId = socket.id;
        room.users[existingIndex].isHost = true;
      }
      newUser = room.users[existingIndex];
    } else {
      // First user becomes host, second user is guest
      const isHost = room.users.length === 0;
      newUser = {
        id: socket.id,
        name: cleanName,
        isHost,
        joinedAt: Date.now(),
      };
      if (isHost) {
        room.hostId = socket.id;
      }
      room.users.push(newUser);
    }

    room.lastUpdated = Date.now();

    // Send full current room state to joining client
    socket.emit('room-joined', {
      roomCode: code,
      users: room.users,
      hostId: room.hostId,
      currentVideoId: room.currentVideoId,
      currentTime: room.currentTime,
      isPlaying: room.isPlaying,
    });

    // Notify partner in the room
    socket.to(code).emit('partner-joined', {
      user: newUser,
      users: room.users,
      hostId: room.hostId,
    });

    if (typeof callback === 'function') {
      callback({ success: true, roomCode: code });
    }
  });

  // 3. Play event
  socket.on('play', ({ currentTime }: { currentTime: number }) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    // Only host controls playback
    if (room.hostId !== socket.id) {
      return;
    }

    room.isPlaying = true;
    room.currentTime = typeof currentTime === 'number' ? currentTime : 0;
    room.lastUpdated = Date.now();

    // Broadcast to partner
    socket.to(currentRoomCode).emit('play', {
      currentTime: room.currentTime,
    });
  });

  // 4. Pause event
  socket.on('pause', ({ currentTime }: { currentTime: number }) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    // Only host controls playback
    if (room.hostId !== socket.id) {
      return;
    }

    room.isPlaying = false;
    room.currentTime = typeof currentTime === 'number' ? currentTime : 0;
    room.lastUpdated = Date.now();

    // Broadcast to partner
    socket.to(currentRoomCode).emit('pause', {
      currentTime: room.currentTime,
    });
  });

  // 5. Seek event
  socket.on('seek', ({ currentTime }: { currentTime: number }) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    // Only host controls playback
    if (room.hostId !== socket.id) {
      return;
    }

    room.currentTime = typeof currentTime === 'number' ? currentTime : 0;
    room.lastUpdated = Date.now();

    // Broadcast seek timestamp to partner
    socket.to(currentRoomCode).emit('seek', {
      currentTime: room.currentTime,
    });
  });

  // 6. Load video event (Either user can load a video, as specified in requirements)
  socket.on('load-video', ({ videoId }: { videoId: string }) => {
    if (!currentRoomCode || !videoId) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    room.currentVideoId = videoId;
    room.currentTime = 0;
    room.isPlaying = true;
    room.lastUpdated = Date.now();

    // Broadcast to partner and confirm to all
    io.in(currentRoomCode).emit('load-video', {
      videoId,
      currentTime: 0,
      isPlaying: true,
      senderName: userName,
    });
  });

  // 7. Couple Chat Message
  socket.on('chat-message', ({ text }: { text: string }) => {
    if (!currentRoomCode || !text) return;
    const cleanText = text.trim().slice(0, 300);
    if (!cleanText) return;

    const message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      senderId: socket.id,
      senderName: userName,
      text: cleanText,
      timestamp: Date.now(),
    };

    io.in(currentRoomCode).emit('chat-message', message);
  });

  // 8. Sweet couple floating reaction (hearts, hugs, popcorn)
  socket.on('reaction', ({ emoji }: { emoji: string }) => {
    if (!currentRoomCode) return;
    const cleanEmoji = emoji || '💖';
    io.in(currentRoomCode).emit('reaction', {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      emoji: cleanEmoji,
      senderName: userName,
    });
  });

  // 9. Disconnect handling
  socket.on('disconnect', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    const leavingUser = room.users.find((u) => u.id === socket.id);
    const wasHost = room.hostId === socket.id;

    // Remove user
    room.users = room.users.filter((u) => u.id !== socket.id);
    room.lastUpdated = Date.now();

    // If the host left and another user is still present, promote that user to host!
    if (wasHost && room.users.length > 0) {
      room.users[0].isHost = true;
      room.hostId = room.users[0].id;
    }

    // Broadcast partner-left to the room
    socket.to(currentRoomCode).emit('partner-left', {
      user: leavingUser || { id: socket.id, name: userName },
      users: room.users,
      hostId: room.hostId,
    });
  });
});

// Vite middleware & Static serving setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`WatchTogether server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
