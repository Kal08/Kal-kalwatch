import React, { useState } from 'react';
import { Copy, Check, Heart, Play, Share2 } from 'lucide-react';

interface ShareRoomModalProps {
  roomCode: string;
  userName: string;
  onEnterRoom: () => void;
}

export const ShareRoomModal: React.FC<ShareRoomModalProps> = ({
  roomCode,
  userName,
  onEnterRoom,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const inviteLink = typeof window !== 'undefined'
    ? `${window.location.origin}?code=${roomCode}`
    : `?code=${roomCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-rose-100 bg-white p-6 shadow-2xl sm:p-8">
        {/* Soft background glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-purple-200/40 blur-3xl" />

        <div className="relative text-center">
          {/* Heart Badge */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-200">
            <Heart className="h-7 w-7 fill-white stroke-white animate-pulse-gentle" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            Room Created!
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Share this private code with your partner to sync your watch party.
          </p>

          {/* 6-character Code Display */}
          <div className="my-6">
            <div className="flex justify-center gap-2">
              {roomCode.split('').map((char, index) => (
                <div
                  key={index}
                  className="flex h-12 w-10 items-center justify-center rounded-xl border-2 border-rose-200 bg-rose-50/50 text-xl font-black tracking-wider text-rose-700 shadow-sm"
                >
                  {char}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleCopyCode}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-rose-200 transition hover:opacity-95 active:scale-[0.99]"
            >
              {copiedCode ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Code Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy 6-Character Code</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyLink}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-rose-200 hover:bg-rose-50/50 active:scale-[0.99]"
            >
              {copiedLink ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Invite Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 text-slate-500" />
                  <span>Copy Direct Invite Link</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <button
              onClick={onEnterRoom}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99]"
            >
              <span>Enter Watch Room</span>
              <Play className="h-4 w-4 fill-white" />
            </button>
            <p className="mt-2 text-xs text-slate-400">
              You can start picking a video while waiting for your partner.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
