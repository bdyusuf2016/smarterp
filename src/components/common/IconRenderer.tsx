import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconRendererProps {
  name: string;
  className?: string;
  size?: number;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, className = 'w-5 h-5', size }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (LucideIcons as any)[name] || (LucideIcons as any)[name.charAt(0).toUpperCase() + name.slice(1)] || LucideIcons.HelpCircle;

  return <IconComponent className={className} size={size} />;
};
