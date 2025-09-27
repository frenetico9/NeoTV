import React, { useEffect, useRef } from 'react';

// Using global videojs from CDN script in index.html
declare const videojs: any;

interface PlayerProps {
  url: string;
  title: string;
  onProgress: (progress: number) => void;
}

export const Player: React.FC<PlayerProps> = ({ url, onProgress }) => {
    const videoNodeRef = useRef<HTMLVideoElement | null>(null);
    const playerRef = useRef<any>(null);

    // Initialize player on mount, and clean up on unmount
    useEffect(() => {
        // Ensure video ref exists and player isn't already initialized
        if (videoNodeRef.current && !playerRef.current) {
            const player = playerRef.current = videojs(videoNodeRef.current, {
                autoplay: true,
                controls: true,
                responsive: true,
                fluid: true,
            }, () => {
                console.log('Player is ready');
            });

            let lastProgressReportTime = 0;
            player.on('timeupdate', () => {
                if (player.isDisposed()) return;
                const now = Date.now();
                const duration = player.duration();
                
                // Report progress every 5 seconds
                if (duration > 0 && (now - lastProgressReportTime > 5000)) {
                    const progress = player.currentTime() / duration;
                    onProgress(progress);
                    lastProgressReportTime = now;
                }
            });
        }

        // Dispose player on unmount
        return () => {
            if (playerRef.current && !playerRef.current.isDisposed()) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, [onProgress]);

    // Update source when URL prop changes
    useEffect(() => {
        if (playerRef.current) {
            playerRef.current.src({
                src: url,
                type: 'application/x-mpegURL', // Specify HLS source type
            });
        }
    }, [url]);

    return (
        // The data-vjs-player attribute is important for Video.js to find the container
        <div data-vjs-player className="w-full h-full">
            {/* The video element needs specific classes for the skin */}
            <video ref={videoNodeRef} className="video-js vjs-big-play-centered w-full h-full" />
        </div>
    );
};