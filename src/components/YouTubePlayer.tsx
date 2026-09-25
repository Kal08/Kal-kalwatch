import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize, Lock, Sparkles, AlertCircle } from 'lucide-react';
import { formatTime } from '../utils/youtube';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubePlayerProps {
  videoId: string;
  isHost: boolean;
  hostName: string;
  initialTime?: number;
  initialPlaying?: boolean;
  onPlay: (currentTime: number) => void;
  onPause: (currentTime: number) => void;
  onSeek: (currentTime: number) => void;
  remoteCommand?: {
    type: 'play' | 'pause' | 'seek';
    time: number;
    id: number;
  } | null;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  isHost,
  hostName,
  initialTime = 0,
  initialPlaying = false,
  onPlay,
  onPause,
  onSeek,
  remoteCommand,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const isPlayerReadyRef = useRef<boolean>(false);
  const isRemoteActionRef = useRef<boolean>(false);
  const lastStateRef = useRef<number>(-1);
  const progressTimerRef = useRef<any>(null);

  const [currentTime, setCurrentTime] = useState<number>(initialTime);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(initialPlaying);
  const [volume, setVolume] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);

  // Initialize or reload YouTube player
  const setupPlayer = useCallback(() => {
    if (!window.YT || !window.YT.Player || !containerRef.current) return;

    // Destroy existing instance cleanly if any
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        console.warn('Error destroying player:', e);
      }
      playerRef.current = null;
      isPlayerReadyRef.current = false;
    }

    // Create unique div element for iframe replacement
    const playerId = 'yt-player-instance';
    containerRef.current.innerHTML = `<div id="${playerId}"></div>`;

    playerRef.current = new window.YT.Player(playerId, {
      videoId: videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: initialPlaying ? 1 : 0,
        controls: isHost ? 1 : 0, // Disable native controls for guest
        disablekb: isHost ? 0 : 1,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        enablejsapi: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: (event: any) => {
          isPlayerReadyRef.current = true;
          setDuration(event.target.getDuration() || 0);

          if (initialTime > 0) {
            event.target.seekTo(initialTime, true);
          }

          if (initialPlaying) {
            try {
              event.target.playVideo();
            } catch (err) {
              setAutoplayBlocked(true);
            }
          }
        },
        onStateChange: (event: any) => {
          const state = event.data;
          lastStateRef.current = state;

          // YT.PlayerState: PLAYING = 1, PAUSED = 2, BUFFERING = 3, ENDED = 0
          if (state === 1) {
            // Playing
            setIsPlaying(true);
            setIsBuffering(false);
            setAutoplayBlocked(false);

            if (isHost && !isRemoteActionRef.current) {
              const time = event.target.getCurrentTime();
              onPlay(time);
            }
          } else if (state === 2) {
            // Paused
            setIsPlaying(false);
            setIsBuffering(false);

            if (isHost && !isRemoteActionRef.current) {
              const time = event.target.getCurrentTime();
              onPause(time);
            }
          } else if (state === 3) {
            // Buffering
            setIsBuffering(true);
          }
        },
        onError: (e: any) => {
          console.warn('YouTube Player error code:', e.data);
        },
      },
    });
  }, [videoId, isHost, initialTime, initialPlaying, onPlay, onPause]);

  // Load YouTube Iframe API script if not loaded
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setupPlayer();
    } else {
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }

      window.onYouTubeIframeAPIReady = () => {
        setupPlayer();
      };
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [setupPlayer]);

  // Handle videoId changes
  useEffect(() => {
    if (isPlayerReadyRef.current && playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      isRemoteActionRef.current = true;
      playerRef.current.loadVideoById({
        videoId,
        startSeconds: 0,
      });
      setCurrentTime(0);
      setIsPlaying(true);
      setTimeout(() => {
        isRemoteActionRef.current = false;
      }, 1000);
    }
  }, [videoId]);

  // Handle incoming remote sync commands (from partner / host)
  useEffect(() => {
    if (!remoteCommand || !isPlayerReadyRef.current || !playerRef.current) return;

    isRemoteActionRef.current = true;

    try {
      const { type, time } = remoteCommand;
      const player = playerRef.current;

      if (typeof player.seekTo === 'function') {
        player.seekTo(time, true);
        setCurrentTime(time);
      }

      if (type === 'play' && typeof player.playVideo === 'function') {
        const playPromise = player.playVideo();
        setIsPlaying(true);
        // Catch browser autoplay policy
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => setAutoplayBlocked(true));
        }
      } else if (type === 'pause' && typeof player.pauseVideo === 'function') {
        player.pauseVideo();
        setIsPlaying(false);
      } else if (type === 'seek') {
        // Just seek
      }
    } catch (e) {
      console.warn('Error handling remote command:', e);
    }

    const timer = setTimeout(() => {
      isRemoteActionRef.current = false;
    }, 800);

    return () => clearTimeout(timer);
  }, [remoteCommand]);

  // Progress update timer
  useEffect(() => {
    progressTimerRef.current = setInterval(() => {
      if (isPlayerReadyRef.current && playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const curr = playerRef.current.getCurrentTime() || 0;
          const dur = playerRef.current.getDuration() || 0;
          setCurrentTime(curr);
          if (dur > 0 && dur !== duration) {
            setDuration(dur);
          }
        } catch {
          // ignore
        }
      }
    }, 500);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [duration]);

  // Host Control Handlers
  const handleTogglePlayPause = () => {
    if (!isHost || !playerRef.current) return;
    const player = playerRef.current;
    const time = player.getCurrentTime ? player.getCurrentTime() : currentTime;

    if (isPlaying) {
      player.pauseVideo();
      setIsPlaying(false);
      onPause(time);
    } else {
      player.playVideo();
      setIsPlaying(true);
      onPlay(time);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isHost || !playerRef.current) return;
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    playerRef.current.seekTo(targetTime, true);
    onSeek(targetTime);
  };

  const handleSkip = (seconds: number) => {
    if (!isHost || !playerRef.current) return;
    const nextTime = Math.max(0, Math.min(duration, currentTime + seconds));
    setCurrentTime(nextTime);
    playerRef.current.seekTo(nextTime, true);
    onSeek(nextTime);
  };

  // Local volume handler (each user can hear at their own preference)
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value, 10);
    setVolume(vol);
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      playerRef.current.setVolume(vol);
      if (vol === 0) {
        playerRef.current.mute();
        setIsMuted(true);
      } else if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
  };

  const handleToggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume > 0 ? volume : 50);
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleManualUnmuteSync = () => {
    if (!playerRef.current) return;
    try {
      playerRef.current.unMute();
      playerRef.current.playVideo();
      setIsPlaying(true);
      setAutoplayBlocked(false);
    } catch {
      // ignore
    }
  };

  const handleFullscreen = () => {
    const el = document.getElementById('watch-player-wrapper');
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <div
      id="watch-player-wrapper"
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-rose-100 bg-slate-950 shadow-2xl shadow-rose-950/20"
    >
      {/* Autoplay blocked banner (Browsers require user click to play with audio) */}
      {autoplayBlocked && (
        <div className="absolute inset-x-0 top-3 z-30 flex justify-center px-4">
          <button
            onClick={handleManualUnmuteSync}
            className="flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xl shadow-rose-900/50 transition hover:bg-rose-500 active:scale-95"
          >
            <Sparkles className="h-4 w-4 animate-spin" />
            <span>Browser paused audio — Tap here to start synced playback!</span>
          </button>
        </div>
      )}

      {/* Video Container */}
      <div className="relative aspect-video w-full bg-black">
        <div ref={containerRef} className="h-full w-full" />

        {/* Guest Overlay: "Only one person at a time controls playback — whoever is the host" */}
        {!isHost && (
          <div className="pointer-events-auto absolute inset-0 z-20 flex flex-col justify-between p-4">
            {/* Top notification pill */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md">
                <Lock className="h-3 w-3 text-rose-400" />
                <span>
                  Controlled by <strong className="text-rose-300">{hostName}</strong>
                </span>
                <span className="hidden sm:inline text-white/60">• Synced in real-time</span>
              </div>

              {isBuffering && (
                <div className="rounded-full bg-rose-500/80 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                  Buffering...
                </div>
              )}
            </div>

            {/* Hint at the bottom */}
            <div className="text-center">
              <span className="rounded-full bg-black/50 px-3 py-1 text-[11px] text-white/70 backdrop-blur-xs">
                Relax and enjoy! Your screen will sync automatically whenever {hostName} plays or seeks.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Custom Control Bar */}
      <div className="flex flex-col gap-2 border-t border-white/10 bg-slate-900/90 p-3 text-white backdrop-blur-md sm:p-4">
        {/* Progress bar (Enabled for Host, Read-only progress for Guest) */}
        <div className="flex items-center gap-3">
          <span className="w-12 text-right text-xs font-mono text-slate-300">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={handleSeekChange}
              disabled={!isHost}
              title={isHost ? 'Drag to seek' : 'Playback position (controlled by host)'}
              className={`h-2 w-full appearance-none rounded-lg bg-slate-700 outline-none transition ${
                isHost ? 'cursor-pointer accent-rose-500 hover:h-2.5' : 'cursor-not-allowed accent-rose-400/80'
              }`}
            />
          </div>
          <span className="w-12 text-xs font-mono text-slate-400">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons and volume row */}
        <div className="flex items-center justify-between">
          {/* Left: Playback controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {isHost ? (
              <>
                <button
                  onClick={() => handleSkip(-10)}
                  title="Rewind 10 seconds"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-200 transition hover:bg-slate-700 active:scale-95"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button
                  onClick={handleTogglePlayPause}
                  title={isPlaying ? 'Pause' : 'Play'}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-900/30 transition hover:opacity-95 active:scale-95"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5 fill-white" />
                  ) : (
                    <Play className="h-5 w-5 fill-white translate-x-0.5" />
                  )}
                </button>

                <button
                  onClick={() => handleSkip(10)}
                  title="Fast forward 10 seconds"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-200 transition hover:bg-slate-700 active:scale-95"
                >
                  <RotateCw className="h-4 w-4" />
                </button>

                <div className="ml-2 hidden text-xs font-medium text-rose-300 sm:block">
                  You are Host (playback synced)
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <span>Syncing with {hostName}'s controls</span>
              </div>
            )}
          </div>

          {/* Right: Personal Volume + Fullscreen */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-300 transition hover:bg-slate-700 active:scale-95"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4 text-rose-400" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>

            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              title="Adjust your volume"
              className="hidden h-1.5 w-16 appearance-none rounded-lg bg-slate-700 accent-rose-500 sm:block cursor-pointer"
            />

            <button
              onClick={handleFullscreen}
              title="Fullscreen"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-300 transition hover:bg-slate-700 active:scale-95"
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
