"use client";

import Image from "next/image";

type LogoProps = {
  size?: number;
  className?: string;
};

export default function AnimatedMascot({
  size = 40,
  className = "",
}: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Apex Interviewer"
      width={size}
      height={size}
      className={className}
      style={{ borderRadius: 8 }}
    />
  );
}
