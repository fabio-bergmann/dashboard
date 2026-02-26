import * as React from "react";

type AuthInputFieldProps = {
  id: string;
  label: string;
  type: React.HTMLInputTypeAttribute;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  autoComplete?: string;
  autoFocus?: boolean;
};

export default function AuthInputField({
  id,
  label,
  type,
  placeholder,
  value,
  onChange,
  icon,
  autoComplete,
  autoFocus,
}: AuthInputFieldProps) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
        {icon}
      </div>
      <input
        id={id}
        type={type}
        placeholder={placeholder ?? label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className="w-full h-12 pl-11 pr-4 text-[15px] text-foreground placeholder:text-muted bg-white border border-border rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
      />
    </div>
  );
}
