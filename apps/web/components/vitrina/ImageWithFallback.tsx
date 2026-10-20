"use client";
import { useState } from "react";
import { ImageIcon } from "lucide-react";
export function ImageWithFallback({ src, alt, className = "" }: { src?: string | null; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-[#f3f4f6] ${className}`}>
        <ImageIcon size={32} className="text-[#9ca3af]" />
      </div>
    );
  }
  return <img src={src} alt={alt} className={`object-cover ${className}`} onError={() => setFailed(true)} loading="lazy" />;
}
