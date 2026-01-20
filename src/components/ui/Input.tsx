import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, icon, className, ...props }, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block font-display italic text-gray-400 text-sm mb-1 uppercase tracking-wider">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                        {icon}
                    </div>
                )}
                <input
                    ref={ref}
                    className={clsx(
                        "w-full bg-neutral-900 border border-neutral-800 text-white py-3 placeholder:text-neutral-600 outline-none transition-all",
                        icon ? "pl-12 pr-4" : "px-4",
                        "focus:border-brand-green focus:shadow-[0_0_10px_rgba(57,255,20,0.2)]",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        error && "border-red-500 focus:border-red-500",
                        className
                    )}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-xs text-red-500 font-mono">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
