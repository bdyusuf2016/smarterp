import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'purple' | 'amber' | 'slate' | 'orange';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'secondary',
  size = 'sm',
  className = ''
}) => {
  const variantStyles = {
    primary: 'bg-blue-50 text-blue-700 border border-blue-100',
    secondary: 'bg-[#f8f9fa] text-[#495057] border border-[#dee2e6]',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    warning: 'bg-amber-50 text-amber-800 border border-amber-100',
    danger: 'bg-rose-50 text-rose-700 border border-rose-100',
    purple: 'bg-purple-50 text-purple-700 border border-purple-100',
    amber: 'bg-amber-50 text-amber-800 border border-amber-100',
    orange: 'bg-orange-50 text-orange-700 border border-orange-100',
    slate: 'bg-[#212529] text-[#adb5bd] border border-[#343a40]'
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-bold uppercase tracking-tight rounded',
    md: 'text-[11px] px-2.5 py-0.5 font-bold uppercase tracking-tight rounded'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
};

