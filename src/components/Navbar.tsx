import React, { useState } from 'react';
import { Heart, Copy, Check, LogOut, Users, Sparkles } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  roomCode: string | null;
  users: User[];
  currentUserId: string;
  onLeaveRoom: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomCode,
  users,
  currentUserId,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const partner = users.find((u) => u.id !== currentUserId);
  const currentUser = users.find((u) => u.id === currentUserId);
  const isConnected = !!partner;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-rose-100 bg-white/80 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-500 text-white shadow-sm shadow-rose-200">
            <Heart className="h-5 w-5 fill-white/90 stroke-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-slate-800">
                WatchTogether
              </span>
              <span className="hidden rounded-full bg-rose-100/70 px-2 py-0.5 text-[11px] font-medium text-rose-700 sm:inline-block">
                For Couples
              </span>
            </div>
            <p className="hidden text-xs text-slate-400 sm:block">
              Distance means so little when someone means so much
            </p>
          </div>
        </div>

        {/* Room & Status Info if in a room */}
        {roomCode && (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Status indicator */}
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isConnected
                  ? 'border border-emerald-200/80 bg-emerald-50 text-emerald-700'
                  : 'border border-amber-200/80 bg-amber-50 text-amber-700'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                    isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
              </span>
              <span className="hidden xs:inline">
                {isConnected ? (
                  <span className="flex items-center gap-1">
                    <span>Connected with</span>
                    <strong className="font-semibold text-emerald-800">{partner?.name}</strong>
                    <span>💖</span>
                  </span>
                ) : (
                  'Waiting for partner...'
                )}
              </span>
              <span className="xs:hidden">
                {isConnected ? `${partner?.name} 💖` : 'Waiting...'}
              </span>
            </div>

            {/* Room Code Badge */}
            <button
              onClick={handleCopyCode}
              title="Click to copy room code"
              className="group flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100/70 active:scale-95"
            >
              <span className="text-slate-400 font-normal">Code:</span>
              <span className="tracking-wider">{roomCode}</span>
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-rose-400 transition-colors group-hover:text-rose-600" />
              )}
            </button>

            {/* Leave Room Button */}
            <button
              onClick={onLeaveRoom}
              title="Leave Room"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
