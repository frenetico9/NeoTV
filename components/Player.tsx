
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import type { EPGProgram } from '../types';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Clock } from 'lucide-react';

interface PlayerProps {
  url: string;
  title: string;
  epg?: EPGProgram[];
  onProgress: (progress: number) => void;
}

export const Player: React.FC<PlayerProps> = ({ url, title, epg, onProgress }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    let hls: Hls | null = null;
    const videoElement = videoRef.current;

    const startPlayback = () => {
        videoElement?.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }

    if (videoElement) {
      if (Hls.isSupported() && url.includes('.m3u8')) {
        hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(videoElement);
        hls.on(Hls.Events.MANIFEST_PARSED, startPlayback);
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = url;
        videoElement.addEventListener('loadedmetadata', startPlayback);
      } else {
        videoElement.src = url;
        startPlayback();
      }
    }
    
    // Progress tracking
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = window.setInterval(() => {
        if(videoElement && videoElement.duration > 0 && !videoElement.paused) {
            const progress = videoElement.currentTime / videoElement.duration;
            onProgress(progress);
        }
    }, 5000); // Report progress every 5 seconds


    return () => {
      if (hls) hls.destroy();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [url]);

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    setShowControls(true);
    controlsTimeoutRef.current = window.setTimeout(() => setShowControls(false), 3000);
  };

  useEffect(() => {
    const container = playerContainerRef.current;
    if (container) {
        container.addEventListener('mousemove', resetControlsTimeout);
        container.addEventListener('click', resetControlsTimeout);
    }
    resetControlsTimeout();
    return () => {
      if (container) {
          container.removeEventListener('mousemove', resetControlsTimeout);
          container.removeEventListener('click', resetControlsTimeout);
      }
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleFullscreen = () => {
    const elem = playerContainerRef.current;
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  const currentProgram = epg?.find(p => {
    const now = new Date();
    const [startH, startM] = p.start.split(':').map(Number);
    const [endH, endM] = p.end.split(':').map(Number);
    const startTime = new Date();
    startTime.setHours(startH, startM, 0, 0);
    const endTime = new Date();
    endTime.setHours(endH, endM, 0, 0);
    return now >= startTime && now < endTime;
  });

  return (
    <div ref={playerContainerRef} className="relative w-full h-full bg-black flex items-center justify-center">
      <video ref={videoRef} className="w-full h-full" />
      <div className={`absolute inset-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        {/* Top controls are now in PlayerPage.tsx */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center space-x-4">
          <button onClick={togglePlay} className="text-white p-2 hover:bg-white/20 rounded-full">
            {isPlaying ? <Pause size={32} /> : <Play size={32} />}
          </button>
          <div className="flex items-center space-x-2">
            <button onClick={toggleMute} className="text-white p-2 hover:bg-white/20 rounded-full">
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-24 accent-purple-500"
            />
          </div>
          <div className="flex-grow"></div>
           {currentProgram && (
             <div className="hidden md:flex items-center mr-4 bg-black/50 p-2 rounded-lg max-w-md">
                <Clock size={20} className="mr-2 text-purple-400 flex-shrink-0"/>
                <div>
                    <p className="font-semibold text-sm">{currentProgram.title} <span className="font-normal text-gray-300">({currentProgram.start} - {currentProgram.end})</span></p>
                    <p className="text-xs text-gray-400 line-clamp-1">{currentProgram.description}</p>
                </div>
            </div>
          )}
          <button onClick={toggleFullscreen} className="text-white p-2 hover:bg-white/20 rounded-full">
            {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
          </button>
        </div>
      </div>
    </div>
  );
};
