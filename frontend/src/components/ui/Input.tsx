import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-[#6B7280] mb-1.5 font-inter"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={[
              "w-full px-4 py-2.5 bg-white/[0.04] rounded-lg text-sm",
              "text-[#F0F2F5] placeholder-[#6B7280]",
              "border transition-colors duration-150 focus:outline-none focus:ring-1",
              error
                ? "border-red-500/50 focus:border-red-400 focus:ring-red-400/20"
                : "border-white/[0.08] focus:border-[#C89B3C] focus:ring-[#C89B3C]/15",
              icon ? "pl-10" : "",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]">
              {icon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-red-400 text-xs mt-1 font-inter">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
