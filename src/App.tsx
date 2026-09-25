import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { WatchRoom } from './components/WatchRoom';
import { ShareRoomModal } from './components/ShareRoomModal';
import { User, ChatMessage, FloatingReaction, RoomData } from './types';

export default function App() {
  const socketRef = useRef<Socket | null>(null);

  const [connected, setConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [hostId, setHostId] = useState<string>('');
  const [currentVideoId, setCurrentVideoId] = useState<string>('LXb3EKWsInQ');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [urlParamCode, setUrlParamCode] = useState<string>('');

  const [remoteCommand, setRemoteCommand] = useState<{
    type: 'play' | 'pause' | 'seek';
    time: number;
    id: number;
  } | null>(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    // Check URL parameters for direct room join invite (?code=ABC123)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) {
        setUrlParamCode(code.toUpperCase());
      }
    }

    const socket = io({
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setCurrentUserId(socket.id || '');

      // Check if rejoining after page refresh
      const savedSession = sessionStorage.getItem('watchtogether_session');
      if (savedSession) {
        try {
          const { code, name } = JSON.parse(savedSession);
          if (code && name) {
            setUserName(name);
            socket.emit('join-room', { name, roomCode: code });
          }
        } catch {
          // ignore
        }
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Handle room-joined event from server
    socket.on(
      'room-joined',
      (data: {
        roomCode: string;
        users: User[];
        hostId: string;
        currentVideoId: string;
        currentTime: number;
        isPlaying: boolean;
      }) => {
        setRoomCode(data.roomCode);
        setUsers(data.users);
        setHostId(data.hostId);
        setCurrentVideoId(data.currentVideoId || 'LXb3EKWsInQ');
        setCurrentTime(data.currentTime || 0);
        setIsPlaying(data.isPlaying || false);
        setIsConnecting(false);
        setErrorMessage(null);

        // Save session for seamless reload recovery
        sessionStorage.setItem(
          'watchtogether_session',
          JSON.stringify({ code: data.roomCode, name: userName })
        );
      }
    );

    // Partner joined notification
    socket.on(
      'partner-joined',
      (data: { user: User; users: User[]; hostId: string }) => {
        setUsers(data.users);
        setHostId(data.hostId);
        setMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            senderId: 'system',
            senderName: 'System',
            text: `💖 ${data.user.name} joined the room!`,
            timestamp: Date.now(),
            isSystem: true,
          },
        ]);
      }
    );

    // Partner left notification
    socket.on(
      'partner-left',
      (data: { user: User; users: User[]; hostId: string }) => {
        setUsers(data.users);
        setHostId(data.hostId);
        setMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            senderId: 'system',
            senderName: 'System',
            text: `${data.user.name} left the room.`,
            timestamp: Date.now(),
            isSystem: true,
          },
        ]);
      }
    );

    // Play event broadcast from host
    socket.on('play', ({ currentTime }: { currentTime: number }) => {
      setIsPlaying(true);
      setRemoteCommand({
        type: 'play',
        time: currentTime,
        id: Date.now(),
      });
    });

    // Pause event broadcast from host
    socket.on('pause', ({ currentTime }: { currentTime: number }) => {
      setIsPlaying(false);
      setRemoteCommand({
        type: 'pause',
        time: currentTime,
        id: Date.now(),
      });
    });

    // Seek event broadcast from host
    socket.on('seek', ({ currentTime }: { currentTime: number }) => {
      setCurrentTime(currentTime);
      setRemoteCommand({
        type: 'seek',
        time: currentTime,
        id: Date.now(),
      });
    });

    // Load video broadcast
    socket.on(
      'load-video',
      (data: { videoId: string; currentTime: number; isPlaying: boolean; senderName?: string }) => {
        setCurrentVideoId(data.videoId);
        setCurrentTime(0);
        setIsPlaying(true);
        if (data.senderName) {
          setMessages((prev) => [
            ...prev,
            {
              id: `sys-${Date.now()}`,
              senderId: 'system',
              senderName: 'System',
              text: `🎬 ${data.senderName} loaded a new video!`,
              timestamp: Date.now(),
              isSystem: true,
            },
          ]);
        }
      }
    );

    // Couple chat message
    socket.on('chat-message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Romantic floating reactions
    socket.on(
      'reaction',
      (data: { id: string; emoji: string; senderName: string }) => {
        const xPos = Math.floor(Math.random() * 70) + 15; // 15% to 85% width
        const newReaction: FloatingReaction = {
          id: data.id,
          emoji: data.emoji,
          senderName: data.senderName,
          x: xPos,
        };

        setFloatingReactions((prev) => [...prev, newReaction]);

        setTimeout(() => {
          setFloatingReactions((prev) => prev.filter((r) => r.id !== data.id));
        }, 2200);
      }
    );

    // Error messages from server
    socket.on('error-message', ({ message }: { message: string }) => {
      setErrorMessage(message);
      setIsConnecting(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Handlers
  const handleCreateRoom = (name: string) => {
    setUserName(name);
    setIsConnecting(true);
    setErrorMessage(null);
    socketRef.current?.emit('create-room', { name }, (res: any) => {
      if (res?.success) {
        setShowShareModal(true);
      }
    });
  };

  const handleJoinRoom = (name: string, code: string) => {
    setUserName(name);
    setIsConnecting(true);
    setErrorMessage(null);
    socketRef.current?.emit('join-room', { name, roomCode: code });
  };

  const handlePlay = (time: number) => {
    socketRef.current?.emit('play', { currentTime: time });
  };

  const handlePause = (time: number) => {
    socketRef.current?.emit('pause', { currentTime: time });
  };

  const handleSeek = (time: number) => {
    socketRef.current?.emit('seek', { currentTime: time });
  };

  const handleLoadVideo = (videoId: string) => {
    socketRef.current?.emit('load-video', { videoId });
  };

  const handleSendMessage = (text: string) => {
    socketRef.current?.emit('chat-message', { text });
  };

  const handleSendReaction = (emoji: string) => {
    socketRef.current?.emit('reaction', { emoji });
  };

  const handleLeaveRoom = () => {
    sessionStorage.removeItem('watchtogether_session');
    setRoomCode(null);
    setUsers([]);
    setHostId('');
    setMessages([]);
    setShowShareModal(false);
    // Reload or reset socket state
    window.location.href = window.location.pathname;
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-rose-50/50 via-pink-50/30 to-purple-50/40 text-slate-800">
      {/* Navbar */}
      <Navbar
        roomCode={roomCode}
        users={users}
        currentUserId={currentUserId}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* Main View: Landing or Watch Room */}
      <main className="flex-1">
        {!roomCode ? (
          <LandingPage
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            initialCode={urlParamCode}
            errorMessage={errorMessage}
            onClearError={() => setErrorMessage(null)}
            isConnecting={isConnecting}
          />
        ) : (
          <WatchRoom
            roomCode={roomCode}
            users={users}
            currentUserId={currentUserId}
            hostId={hostId}
            currentVideoId={currentVideoId}
            currentTime={currentTime}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeek={handleSeek}
            onLoadVideo={handleLoadVideo}
            onSendMessage={handleSendMessage}
            onSendReaction={handleSendReaction}
            messages={messages}
            floatingReactions={floatingReactions}
            remoteCommand={remoteCommand}
          />
        )}
      </main>

      {/* Share Room Modal popup right after room creation */}
      {showShareModal && roomCode && (
        <ShareRoomModal
          roomCode={roomCode}
          userName={userName}
          onEnterRoom={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
