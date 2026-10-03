import React from 'react';

export interface FieldBaseProps {
 label?: string;
 error?: string;
 helperText?: string;
 className?: string;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, FieldBaseProps {
 leftElement?: React.ReactNode;
 rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
 label,
 error,
 helperText,
 leftElement,
 rightElement,
 className = '',
 id,
 ...props
}, ref) => {
 const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

 return (
 <div className={`w-full flex flex-col gap-1.5 ${className}`}>
 {label && (
 <label htmlFor={inputId} className="text-xs font-semibold text-ink-2">
 {label}
 </label>
 )}
 <div className="relative flex items-center">
 {leftElement && (
 <div className="absolute left-3.5 text-ink-3 pointer-events-none flex items-center">
 {leftElement}
 </div>
 )}
 <input
 ref={ref}
 id={inputId}
 className={`w-full h-11 px-3.5 ${leftElement ? 'pl-10' : ''} ${rightElement ? 'pr-10' : ''} bg-surface text-ink-1 placeholder:text-ink-3 border rounded-xl min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
 error ? 'border-negative' : 'border-line-input/60 hover:border-line-input'
 }`}
 {...props}
 />
 {rightElement && (
 <div className="absolute right-3.5 text-ink-3 flex items-center">
 {rightElement}
 </div>
 )}
 </div>
 {error && <span className="text-xs text-negative font-medium">{error}</span>}
 {!error && helperText && <span className="text-xs text-ink-3">{helperText}</span>}
 </div>
 );
});
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement>, FieldBaseProps {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
 label,
 error,
 helperText,
 className = '',
 children,
 id,
 ...props
}, ref) => {
 const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

 return (
 <div className={`w-full flex flex-col gap-1.5 ${className}`}>
 {label && (
 <label htmlFor={selectId} className="text-xs font-semibold text-ink-2">
 {label}
 </label>
 )}
 <select
 ref={ref}
 id={selectId}
 className={`w-full h-11 px-3.5 bg-surface text-ink-1 border rounded-xl min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
 error ? 'border-negative' : 'border-line-input/60 hover:border-line-input'
 }`}
 {...props}
 >
 {children}
 </select>
 {error && <span className="text-xs text-negative font-medium">{error}</span>}
 {!error && helperText && <span className="text-xs text-ink-3">{helperText}</span>}
 </div>
 );
});
Select.displayName = 'Select';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, FieldBaseProps {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
 label,
 error,
 helperText,
 className = '',
 id,
 ...props
}, ref) => {
 const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

 return (
 <div className={`w-full flex flex-col gap-1.5 ${className}`}>
 {label && (
 <label htmlFor={textareaId} className="text-xs font-semibold text-ink-2">
 {label}
 </label>
 )}
 <textarea
 ref={ref}
 id={textareaId}
 className={`w-full p-3.5 bg-surface text-ink-1 placeholder:text-ink-3 border rounded-xl min-h-[88px] transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
 error ? 'border-negative' : 'border-line-input/60 hover:border-line-input'
 }`}
 {...props}
 />
 {error && <span className="text-xs text-negative font-medium">{error}</span>}
 {!error && helperText && <span className="text-xs text-ink-3">{helperText}</span>}
 </div>
 );
});
Textarea.displayName = 'Textarea';

export interface AmountInputProps extends Omit<InputProps, 'leftElement' | 'type'> {
 currencySymbol?: string;
}

export const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(({
 currencySymbol = '₹',
 ...props
}, ref) => {
 return (
 <Input
 ref={ref}
 type="text"
 inputMode="decimal"
 leftElement={<span className="font-bold text-base text-ink-2 select-none">{currencySymbol}</span>}
 {...props}
 />
 );
});
AmountInput.displayName = 'AmountInput';
