import React from 'react';

export const GridPattern = ({ color = "#e5e7eb" }) => {
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
    <div
      className="absolute inset-0 -z-10 h-full w-full bg-transparent"
      style={{
        backgroundImage: `linear-gradient(to right, ${toRgba(color, 0.08)} 1px, transparent 1px), linear-gradient(to bottom, ${toRgba(color, 0.08)} 1px, transparent 1px)`,
        backgroundSize: '14px 24px',
      }}
    >
      <div
        className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full blur-[100px]"
        style={{ backgroundColor: toRgba(color, 0.22) }}
      ></div>
    </div>
  );
};
