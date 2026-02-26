"use client";

import { useRef, KeyboardEvent, ClipboardEvent } from "react";

export default function CodeInput({
  value,
  onChange,
  onComplete,
  length = 6,
}: {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  length?: number;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  function emitChange(newValue: string) {
    onChange(newValue);
    const digitsOnly = newValue.replace(/\D/g, "");
    if (digitsOnly.length === length && onComplete) {
      onComplete(digitsOnly);
    }
  }

  function handleChange(index: number, char: string) {
    if (char && !/^\d$/.test(char)) return;
    const next = digits.slice();
    next[index] = char;
    emitChange(next.join(""));
    if (char && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pasted) {
      const padded = pasted.padEnd(length, "").slice(0, length);
      emitChange(padded);
      const focusIndex = Math.min(pasted.length, length - 1);
      inputs.current[focusIndex]?.focus();
    }
  }

  return (
    <div className="flex gap-2">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="w-12 h-14 text-center text-[20px] font-semibold text-foreground bg-surface border border-border rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
        />
      ))}
    </div>
  );
}
