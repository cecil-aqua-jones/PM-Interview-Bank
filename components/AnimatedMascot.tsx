"use client";

import { useRef, useEffect } from "react";

type AnimatedMascotProps = {
  size?: number;
  className?: string;
};

export default function AnimatedMascot({ 
  size = 40, 
  className = "" 
}: AnimatedMascotProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Ensure video plays on mount
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay might be blocked, that's ok
      });
    }
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        borderRadius: 8,
        background: "transparent",
      }}
    >
      {/* WebM (AV1) - smallest, best quality, modern browsers */}
      <source src="/mascot.webm" type="video/webm" />
      {/* MP4 (H.264) - universal fallback */}
      <source src="/mascot.mp4" type="video/mp4" />
      {/* Fallback for browsers that don't support video */}
      <div 
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, #1a1918 0%, #4a4845 100%)",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontWeight: 700,
          fontSize: size * 0.35,
        }}
      >
        PL
      </div>
    </video>
  );
}
