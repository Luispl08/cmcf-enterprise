import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className, ...props }, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block font-display italic text-gray-400 text-sm mb-1 uppercase tracking-wider">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                className={clsx(
                    "w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3 placeholder:text-neutral-600 outline-none transition-all",
                    "focus:border-brand-green focus:shadow-[0_0_10px_rgba(57,255,20,0.2)]",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    error && "border-red-500 focus:border-red-500",
                    className
                )}
                {...props}
            />
            {error && (
                <p className="mt-1 text-xs text-red-500 font-mono">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
