import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  circle = false,
  style,
  ...props
}) => {
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height,
        ...style,
      }}
      className={`relative overflow-hidden bg-sunken animate-pulse ${
        circle ? 'rounded-full' : 'rounded-xl'
      } ${className}`}
      {...props}
    />
  );
};
