import React from 'react';

interface GenieCardProps {
  children: React.ReactNode;
  className?: string;
}

const GenieCard: React.FC<GenieCardProps> = ({ children, className }) => {
  return <div className={`genie-card ${className || ''}`.trim()}>{children}</div>;
};

export default GenieCard;
