import React from 'react';

export const DotPattern = ({ color = "#94a3b8" }) => {
  const toRgba = (c: string, alpha: number) => {
    if (!c.startsWith('#')) return c;
    const hex = c.replace('#', '');
    const normalized = hex.length === 3
      ? hex.split('').map((ch) => ch + ch).join('')
      : hex.padEnd(6, '0');
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div className="absolute inset-0 -z-10 h-full w-full bg-transparent">
      <div
        className="absolute h-full w-full [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"
        style={{
          backgroundImage: `radial-gradient(${toRgba(color, 0.25)} 1px, transparent 1px)`,
        }}
      ></div>
    </div>
  );
};
