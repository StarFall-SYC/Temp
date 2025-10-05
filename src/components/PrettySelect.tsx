import { ChevronDown } from 'lucide-react';
import React from 'react';

type Option = { label: string; value: string };

interface PrettySelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

export default function PrettySelect({ value, onChange, options, placeholder, className }: PrettySelectProps) {
  return (
    <div className={`relative ${className ?? ''}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full bg-white/90 backdrop-blur px-4 py-2 pr-10 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-transparent hover:border-brand-cyan/50 transition"
      >
        {placeholder && <option value="" disabled hidden>{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  );
}