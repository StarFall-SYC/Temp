/**
 * 响应式网格组件
 * 根据屏幕大小自动调整列数
 */

import React, { ReactNode } from 'react';

interface ResponsiveGridProps {
  children: ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const gapClasses = {
  sm: 'gap-2 sm:gap-3',
  md: 'gap-4 sm:gap-6',
  lg: 'gap-6 sm:gap-8',
  xl: 'gap-8 sm:gap-10',
};

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  className = '',
}) => {
  const { mobile = 1, tablet = 2, desktop = 3 } = columns;

  const gridColsClass = `
    grid-cols-${mobile}
    sm:grid-cols-${tablet}
    lg:grid-cols-${desktop}
  `;

  return (
    <div
      className={`
        grid
        ${gridColsClass}
        ${gapClasses[gap]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default ResponsiveGrid;

