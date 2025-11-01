/**
 * 响应式容器组件
 * 提供统一的响应式布局和间距
 */

import React, { ReactNode } from 'react';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full',
};

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  fullWidth = false,
  maxWidth = 'full',
}) => {
  const maxWidthClass = fullWidth ? '' : maxWidthClasses[maxWidth];

  return (
    <div
      className={`
        container mx-auto px-4 sm:px-6 lg:px-8
        ${maxWidthClass}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default ResponsiveContainer;

