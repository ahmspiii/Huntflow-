"use client";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("huntflow-theme");
    if (saved === "light") {
      setDark(false);
      document.documentElement.classList.remove("dark");
    } else {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggle = () => {
    const nextDark = !dark;
    setDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("huntflow-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("huntflow-theme", "light");
    }
  };

  if (!mounted) {
    return <div className="w-7 h-7" />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex items-center justify-center p-1.5 rounded border border-line bg-raised/40 text-muted hover:text-text hover:border-steel/50 transition-colors"
      title={dark ? "Switch to Light theme" : "Switch to Dark theme"}
      aria-label="Toggle color theme"
    >
      {dark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-steel" />}
    </button>
  );
}
