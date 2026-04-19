"use client";

interface LogoImgProps {
  className?: string;
}

export function LogoImg({ className = "w-full h-full object-contain" }: LogoImgProps) {
  return (
    <img
      src="/logo.png"
      alt="Triade Select"
      className={className}
      onError={(e) => {
        (e.target as HTMLImageElement).src = "/logo.svg";
      }}
    />
  );
}
