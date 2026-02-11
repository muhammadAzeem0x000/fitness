import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const PasswordInput = forwardRef(({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="relative">
            <input
                type={showPassword ? 'text' : 'password'}
                className={`${className} pr-10`} // Add padding-right to prevent text from going under the icon
                ref={ref}
                {...props}
            />
            <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors focus:outline-none"
                tabIndex={-1} // Prevent tabbing to the toggle button
            >
                {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                ) : (
                    <Eye className="w-4 h-4" />
                )}
            </button>
        </div>
    );
});

PasswordInput.displayName = 'PasswordInput';
