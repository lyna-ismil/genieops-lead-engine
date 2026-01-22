import React from 'react';

export const AuroraBackground = ({ primaryColor }: { primaryColor: string }) => {
  return (
    <div className="absolute inset-0 -z-10 h-full w-full bg-transparent overflow-hidden">
      <div
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full mix-blend-multiply filter blur-[80px] opacity-30 animate-blob"
        style={{ backgroundColor: primaryColor }}
      ></div>
      <div
        className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob animation-delay-2000"
        style={{ backgroundColor: primaryColor }}
      ></div>
    </div>
  );
};
