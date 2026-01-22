import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils'; // We need to create this util first, but commonly used

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        const baseStyles = "font-display font-bold italic transition-all duration-300 transform disabled:opacity-50 disabled:cursor-not-allowed h-auto whitespace-normal text-center break-words min-h-[44px]";

        const variants = {
            primary: "bg-brand-green text-black hover:bg-white hover:shadow-[0_0_15px_var(--color-brand-green)] skew-x-[-10deg]",
            outline: "border border-gray-700 text-gray-300 hover:border-brand-green hover:text-brand-green",
            ghost: "text-gray-400 hover:text-white",
            danger: "bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-900/40"
        };

        const sizes = {
            sm: "px-3 py-1 text-sm",
            md: "px-6 py-3 text-base",
            lg: "px-8 py-4 text-xl"
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                {...props}
            >
                <span className={variant === 'primary' ? 'block skew-x-[10deg]' : ''}>
                    {props.children}
                </span>
            </button>
        );
    }
);
Button.displayName = 'Button';

export { Button };
