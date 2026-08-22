/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  theme: "light" | "dark";
  onToggle: () => void;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme,
  onToggle,
  className = ""
}) => {
  const isDark = theme === "dark";

  return (
    <button
      id="theme-toggle-btn"
      type="button"
      onClick={onToggle}
      aria-label={isDark ? "Switch to Day Light Mode" : "Switch to Workshop Dark Mode"}
      title={isDark ? "Switch to Day Mode (Light Theme)" : "Switch to Workshop Mode (Dark Theme)"}
      className={`relative inline-flex items-center justify-center p-2 rounded-full transition-all duration-200 cursor-pointer border shadow-2xs hover:scale-105 active:scale-95 ${
        isDark
          ? "bg-slate-800/90 hover:bg-slate-700 text-amber-300 border-slate-700 hover:border-slate-600 ring-1 ring-amber-400/20"
          : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300 ring-1 ring-slate-200/50"
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 scale-100" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700 transition-transform duration-300 rotate-0 scale-100" />
        )}
      </div>

      {/* Workshop mode label pill on larger desktop */}
      <span className="sr-only">
        {isDark ? "Light Mode" : "Dark Mode"}
      </span>
    </button>
  );
};
