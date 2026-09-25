export interface User {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  senderName: string;
  x: number;
}

export interface RoomData {
  code: string;
  hostId: string;
  users: User[];
  currentVideoId: string;
  currentTime: number;
  isPlaying: boolean;
}
