import React, { useState } from 'react';
import { YouTubePlayer } from './YouTubePlayer';
import { ChatAndReactions } from './ChatAndReactions';
import { User, ChatMessage, FloatingReaction } from '../types';
import { extractYouTubeVideoId, SUGGESTED_VIDEOS, SuggestedVideo } from '../utils/youtube';
import { Search, Link, Users, Crown, Sparkles, AlertCircle, PlayCircle, Heart } from 'lucide-react';

interface WatchRoomProps {
  roomCode: string;
  users: User[];
  currentUserId: string;
  hostId: string;
  currentVideoId: string;
  currentTime: number;
  isPlaying: boolean;
  onPlay: (time: number) => void;
  onPause: (time: number) => void;
  onSeek: (time: number) => void;
  onLoadVideo: (videoId: string) => void;
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
  messages: ChatMessage[];
  floatingReactions: FloatingReaction[];
  remoteCommand: {
    type: 'play' | 'pause' | 'seek';
    time: number;
    id: number;
  } | null;
}

export const WatchRoom: React.FC<WatchRoomProps> = ({
  roomCode,
  users,
  currentUserId,
  hostId,
  currentVideoId,
  currentTime,
  isPlaying,
  onPlay,
  onPause,
  onSeek,
  onLoadVideo,
  onSendMessage,
  onSendReaction,
  messages,
  floatingReactions,
  remoteCommand,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  const currentUser = users.find((u) => u.id === currentUserId);
  const hostUser = users.find((u) => u.id === hostId);
  const isHost = currentUserId === hostId;
  const partner = users.find((u) => u.id !== currentUserId);

  const handleLoadVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const extractedId = extractYouTubeVideoId(urlInput);
    if (!extractedId) {
      setUrlError('Could not find a valid YouTube video ID in that link. Please try standard youtube.com or youtu.be links.');
      return;
    }

    setUrlError(null);
    onLoadVideo(extractedId);
    setUrlInput('');
  };

  const handleSelectSuggested = (video: SuggestedVideo) => {
    setUrlError(null);
    onLoadVideo(video.id);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Main Left Section: Player & Video Loader (8 cols) */}
        <div className="space-y-4 lg:col-span-8">
          {/* YouTube Player */}
          <YouTubePlayer
            videoId={currentVideoId}
            isHost={isHost}
            hostName={hostUser?.name || 'Host'}
            initialTime={currentTime}
            initialPlaying={isPlaying}
            onPlay={onPlay}
            onPause={onPause}
            onSeek={onSeek}
            remoteCommand={remoteCommand}
          />

          {/* Video URL Input (Either user can paste a YouTube URL) */}
          <div className="rounded-3xl border border-rose-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Link className="h-3.5 w-3.5 text-rose-500" />
                <span>Load YouTube Video (Anyone can pick a video)</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Paste link or video ID
              </span>
            </div>

            <form onSubmit={handleLoadVideoSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (urlError) setUrlError(null);
                  }}
                  placeholder="Paste YouTube link (e.g. https://youtu.be/... or search ID)"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-800 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-1 focus:ring-rose-200"
                />
              </div>
              <button
                type="submit"
                disabled={!urlInput.trim()}
                className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-95 active:scale-95 disabled:opacity-40"
              >
                <PlayCircle className="h-4 w-4" />
                <span>Sync Video</span>
              </button>
            </form>

            {urlError && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{urlError}</span>
              </div>
            )}

            {/* Quick Suggestions for couples */}
            <div className="mt-3.5 border-t border-slate-100 pt-3">
              <span className="text-[11px] font-semibold text-slate-400">
                Quick couple suggestions:
              </span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {SUGGESTED_VIDEOS.map((sug) => (
                  <button
                    key={sug.id}
                    onClick={() => handleSelectSuggested(sug)}
                    className={`rounded-xl border px-2.5 py-1 text-[11px] font-medium transition active:scale-95 ${
                      currentVideoId === sug.id
                        ? 'border-rose-300 bg-rose-50 text-rose-700'
                        : 'border-slate-200 bg-slate-50/80 text-slate-600 hover:border-rose-200 hover:bg-rose-50/40 hover:text-rose-600'
                    }`}
                  >
                    <span>{sug.title.slice(0, 28)}...</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Reaction & Chat trigger bar */}
          <ChatAndReactions
            messages={messages}
            currentUserId={currentUserId}
            onSendMessage={onSendMessage}
            onSendReaction={onSendReaction}
            floatingReactions={floatingReactions}
          />
        </div>

        {/* Right Section: Room details & participants (4 cols) */}
        <div className="space-y-4 lg:col-span-4">
          {/* Who's in the room card */}
          <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-rose-50 pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900">In This Watch Room</h3>
              </div>
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                {users.length} {users.length === 1 ? 'person' : 'people'}
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              {users.map((user) => {
                const isUserHost = user.id === hostId;
                const isMe = user.id === currentUserId;

                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between rounded-2xl p-3 text-xs transition ${
                      isMe ? 'bg-rose-50/60 border border-rose-100' : 'bg-slate-50 border border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-400 to-pink-500 font-bold text-white shadow-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <span>{user.name}</span>
                          {isMe && (
                            <span className="text-[10px] font-normal text-slate-400">
                              (You)
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isUserHost ? 'Controlling Playback' : 'Synced Viewer'}
                        </div>
                      </div>
                    </div>

                    {isUserHost && (
                      <div className="flex items-center gap-1 rounded-full bg-amber-100/80 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        <Crown className="h-3 w-3 text-amber-600" />
                        <span>Host</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Waiting for partner prompt if only 1 person */}
              {users.length === 1 && (
                <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/30 p-3.5 text-center text-xs text-slate-500">
                  <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-500 animate-pulse-gentle">
                    <Heart className="h-4 w-4 fill-rose-500" />
                  </div>
                  <div className="font-semibold text-rose-800">Waiting for your partner...</div>
                  <div className="mt-0.5 text-[11px] text-slate-400">
                    Share room code <strong className="font-mono text-rose-700">{roomCode}</strong> or the invite link so they can join!
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sync Rules explanation pill card */}
          <div className="rounded-3xl border border-rose-100/70 bg-gradient-to-br from-rose-50/50 to-purple-50/50 p-4 shadow-xs text-xs text-slate-600">
            <div className="mb-2 flex items-center gap-1.5 font-bold text-rose-900">
              <Sparkles className="h-3.5 w-3.5 text-rose-500" />
              <span>Couples Sync Rules</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-500">
              <li className="flex items-start gap-1.5">
                <span className="text-rose-500">•</span>
                <span>The first person is the <strong>Host</strong> who controls play, pause & seek.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-rose-500">•</span>
                <span>Both partners stay frame-synced at exact millisecond timestamps.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-rose-500">•</span>
                <span>Either partner can paste and load a new YouTube video anytime.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-rose-500">•</span>
                <span>If the host leaves, the partner automatically becomes the new host.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
