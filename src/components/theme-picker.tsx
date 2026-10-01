"use client";

import { Check } from "lucide-react";
import { APP_THEMES, type AppTheme } from "@/lib/themes";

export function ThemePicker({
  value,
  onChange,
  disabled = false,
}: {
  value: AppTheme;
  onChange: (theme: AppTheme) => void;
  disabled?: boolean;
}) {
  return (
    <div className="theme-picker" role="group" aria-label="Color theme">
      {(Object.entries(APP_THEMES) as [AppTheme, (typeof APP_THEMES)[AppTheme]][]).map(
        ([theme, details]) => (
          <button
            key={theme}
            type="button"
            className="theme-option"
            aria-pressed={value === theme}
            aria-label={details.label}
            title={details.label}
            disabled={disabled}
            onClick={() => onChange(theme)}
          >
            <span className="theme-swatch" aria-hidden="true">
              {details.swatches.map((color) => (
                <span key={color} style={{ backgroundColor: color }} />
              ))}
            </span>
            <span className="theme-option-label">{details.label}</span>
            {value === theme && <Check size={16} aria-hidden="true" />}
          </button>
        ),
      )}
    </div>
  );
}