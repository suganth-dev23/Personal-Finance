import React from 'react';

export type CardVariant = 'surface' | 'sunken' | 'hero' | 'interactive';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
 variant?: CardVariant;
 padding?: CardPadding;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({
 variant = 'surface',
 padding = 'md',
 className = '',
 children,
 ...props
}, ref) => {
 const baseStyles = 'rounded-2xl transition-[transform,box-shadow,background-color] duration-200';

 const variantStyles: Record<CardVariant, string> = {
 surface: 'bg-surface border border-line shadow-xs',
 sunken: 'bg-sunken border border-line/60',
 hero: 'bg-surface border border-line shadow-sm relative overflow-hidden',
 interactive: 'bg-surface border border-line shadow-xs hover:shadow-md hover:border-primary/40 cursor-pointer press',
 };

 const paddingStyles: Record<CardPadding, string> = {
 none: 'p-0',
 sm: 'p-3 sm:p-4',
 md: 'p-4 sm:p-5',
 lg: 'p-5 sm:p-6',
 };

 return (
 <div
 ref={ref}
 className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
 {...props}
 >
 {children}
 </div>
 );
});

Card.displayName = 'Card';
