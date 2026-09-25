import React, { useState, useEffect } from 'react';
import { Heart, Film, Users, Sparkles, ArrowRight, Video, Link2, AlertCircle } from 'lucide-react';

interface LandingPageProps {
  onCreateRoom: (name: string) => void;
  onJoinRoom: (name: string, roomCode: string) => void;
  initialCode?: string;
  errorMessage?: string | null;
  onClearError?: () => void;
  isConnecting?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onCreateRoom,
  onJoinRoom,
  initialCode = '',
  errorMessage,
  onClearError,
  isConnecting = false,
}) => {
  const [activeTab, setActiveTab] = useState<'landing' | 'create' | 'join'>(
    initialCode ? 'join' : 'landing'
  );
  const [createName, setCreateName] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinCode, setJoinCode] = useState(initialCode || '');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCode) {
      setJoinCode(initialCode.toUpperCase());
      setActiveTab('join');
    }
  }, [initialCode]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      setValidationError('Please enter your name');
      return;
    }
    setValidationError(null);
    onClearError?.();
    onCreateRoom(createName.trim());
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName.trim()) {
      setValidationError('Please enter your name');
      return;
    }
    if (!joinCode.trim() || joinCode.trim().length < 4) {
      setValidationError('Please enter a valid room code');
      return;
    }
    setValidationError(null);
    onClearError?.();
    onJoinRoom(joinName.trim(), joinCode.trim().toUpperCase());
  };

  return (
    <div className="relative flex min-h-[calc(100vh-65px)] flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Romantic ambient gradients */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-to-tr from-rose-200/50 via-pink-200/40 to-purple-200/50 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-10 h-72 w-72 rounded-full bg-pink-100/60 blur-2xl" />

      <div className="relative w-full max-w-lg">
        {/* Header Title & Subtitle */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 text-white shadow-lg shadow-rose-200/80">
            <Heart className="h-7 w-7 fill-white stroke-white animate-pulse-gentle" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Watch Together
          </h1>
          <p className="mt-2 text-base text-slate-600">
            Synchronized YouTube movie dates for long-distance lovers.
          </p>
          <div className="mt-2 flex items-center justify-center gap-2 text-xs font-medium text-rose-600">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Frame-accurate real-time playback sync</span>
          </div>
        </div>

        {/* Global Error Banner if any */}
        {(errorMessage || validationError) && (
          <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-sm animate-in fade-in">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <div className="flex-1 leading-relaxed">
              {validationError || errorMessage}
            </div>
            <button
              onClick={() => {
                setValidationError(null);
                onClearError?.();
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800"
            >
              ✕
            </button>
          </div>
        )}

        {/* Card Container */}
        <div className="overflow-hidden rounded-3xl border border-rose-100/80 bg-white/90 p-6 shadow-xl shadow-rose-100/50 backdrop-blur-md sm:p-8">
          {/* STEP 1: Two Big Buttons Selection */}
          {activeTab === 'landing' && (
            <div className="space-y-4">
              <button
                onClick={() => {
                  setValidationError(null);
                  setActiveTab('create');
                }}
                className="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 p-5 text-left text-white shadow-lg shadow-rose-200/80 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-rose-300/80 active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-xs">
                    <Video className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">Create Room</div>
                    <div className="text-xs text-rose-100">
                      Start a new watch party & invite your partner
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => {
                  setValidationError(null);
                  setActiveTab('join');
                }}
                className="group flex w-full items-center justify-between rounded-2xl border-2 border-slate-200 bg-white p-5 text-left text-slate-800 shadow-sm transition-all hover:border-rose-300 hover:bg-rose-50/30 hover:scale-[1.01] active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100/70 text-rose-600">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">Join Room</div>
                    <div className="text-xs text-slate-500">
                      Enter with a 6-character room code
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-rose-600" />
              </button>
            </div>
          )}

          {/* STEP 2: Create Room Form */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900">Create a Watch Room</h3>
                <button
                  type="button"
                  onClick={() => {
                    setValidationError(null);
                    setActiveTab('landing');
                  }}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  ← Back
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Your Name or Nickname
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g., Sarah, Alex, Honey..."
                  maxLength={24}
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                />
              </div>

              <button
                type="submit"
                disabled={isConnecting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 py-3.5 text-sm font-semibold text-white shadow-md shadow-rose-200 transition hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
              >
                {isConnecting ? (
                  <span>Creating Room...</span>
                ) : (
                  <>
                    <span>Generate Room Code</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: Join Room Form */}
          {activeTab === 'join' && (
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900">Join Partner's Room</h3>
                <button
                  type="button"
                  onClick={() => {
                    setValidationError(null);
                    setActiveTab('landing');
                  }}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  ← Back
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Your Name
                </label>
                <input
                  type="text"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  placeholder="e.g., Liam, Sweetheart..."
                  maxLength={24}
                  autoFocus={!initialCode}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  6-Character Room Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g., AB3X9Q"
                  maxLength={10}
                  autoFocus={!!initialCode}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-center text-lg font-bold tracking-widest text-slate-900 uppercase outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100 placeholder:text-sm placeholder:font-normal placeholder:tracking-normal"
                />
              </div>

              <button
                type="submit"
                disabled={isConnecting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-rose-200 transition hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
              >
                {isConnecting ? (
                  <span>Entering Room...</span>
                ) : (
                  <>
                    <span>Enter Watch Room</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center text-xs text-slate-500">
          <div className="rounded-2xl border border-rose-100/60 bg-white/60 p-3 shadow-xs">
            <div className="font-semibold text-slate-700">Instant Sync</div>
            <div className="mt-0.5 text-[11px]">Play, pause & seek together</div>
          </div>
          <div className="rounded-2xl border border-rose-100/60 bg-white/60 p-3 shadow-xs">
            <div className="font-semibold text-slate-700">Host Control</div>
            <div className="mt-0.5 text-[11px]">Clean synchronized playback</div>
          </div>
          <div className="rounded-2xl border border-rose-100/60 bg-white/60 p-3 shadow-xs">
            <div className="font-semibold text-slate-700">Zero Signup</div>
            <div className="mt-0.5 text-[11px]">Just enter names and watch</div>
          </div>
        </div>
      </div>
    </div>
  );
};
