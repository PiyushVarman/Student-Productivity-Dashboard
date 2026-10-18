"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeSlider({ currentTheme = "light", onThemeChange }) {
  // 0: Light, 50: Sunset (middle), 100: Dark
  const [sliderValue, setSliderValue] = useState(
    currentTheme === "sunset" ? 50 : currentTheme === "dark" ? 100 : 0
  );

  const holdTimeoutRef = useRef(null);
  const isHoldingMiddleRef = useRef(false);
  const sunsetJustUnlockedRef = useRef(false);
  const isDraggingRef = useRef(false);

  // Synchronize internal slider position when theme changes externally (and user is not currently dragging)
  useEffect(() => {
    if (!isDraggingRef.current && !isHoldingMiddleRef.current && !sunsetJustUnlockedRef.current) {
      setSliderValue(currentTheme === "sunset" ? 50 : currentTheme === "dark" ? 100 : 0);
    }
  }, [currentTheme]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    };
  }, []);

  const clearTimer = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    isHoldingMiddleRef.current = false;
  };

  const handlePointerDown = () => {
    isDraggingRef.current = true;
  };

  const handleSliderChange = (e) => {
    const val = Number(e.target.value);
    setSliderValue(val);

    // If currently in Sunset theme:
    // User can drag towards light (<40) or dark (>60).
    // Changes commit only on release to guarantee smooth 60fps tracking!
    if (currentTheme === "sunset") {
      clearTimer();
      return;
    }

    // Checking for secret center hold (between 40 and 60) for 3 seconds
    if (val >= 40 && val <= 60) {
      if (!isHoldingMiddleRef.current) {
        isHoldingMiddleRef.current = true;
        holdTimeoutRef.current = setTimeout(() => {
          sunsetJustUnlockedRef.current = true;
          isHoldingMiddleRef.current = false;
          setSliderValue(50);
          onThemeChange?.("sunset");
        }, 3000);
      }
    } else {
      // User moved away from center before 3 seconds
      clearTimer();
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;

    // 1. If the user just unlocked Sunset via the 3-second middle hold, lock it at 50 on release!
    if (sunsetJustUnlockedRef.current) {
      sunsetJustUnlockedRef.current = false;
      clearTimer();
      setSliderValue(50);
      return;
    }

    // 2. If the user was holding in the middle but released before the 3-second hold completed:
    if (isHoldingMiddleRef.current) {
      clearTimer();
      if (sliderValue < 50) {
        setSliderValue(0);
        if (currentTheme !== "light") onThemeChange?.("light");
      } else {
        setSliderValue(100);
        if (currentTheme !== "dark") onThemeChange?.("dark");
      }
      return;
    }

    // 3. If currently in Sunset theme:
    if (currentTheme === "sunset") {
      if (sliderValue < 40) {
        setSliderValue(0);
        onThemeChange?.("light");
      } else if (sliderValue > 60) {
        setSliderValue(100);
        onThemeChange?.("dark");
      } else {
        // Kept near middle, preserve Sunset
        setSliderValue(50);
      }
      return;
    }

    // 4. Normal drag release between light and dark:
    if (sliderValue < 50) {
      setSliderValue(0);
      if (currentTheme !== "light") onThemeChange?.("light");
    } else {
      setSliderValue(100);
      if (currentTheme !== "dark") onThemeChange?.("dark");
    }
  };

  return (
    <div className="flex flex-col items-end gap-1 select-none">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            clearTimer();
            sunsetJustUnlockedRef.current = false;
            setSliderValue(0);
            if (currentTheme !== "light") onThemeChange?.("light");
          }}
          className={`p-1 rounded-full transition-colors cursor-pointer ${
            currentTheme === "light"
              ? "text-amber-500 font-bold bg-amber-500/10"
              : "text-muted-foreground/60 hover:text-foreground hover:bg-muted"
          }`}
          title="Switch to Light Theme"
        >
          <Sun className="h-3.5 w-3.5" />
        </button>

        <div className="relative flex items-center w-20 h-6 bg-muted/80 rounded-full px-1 border border-border/60 shadow-inner">
          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onPointerDown={handlePointerDown}
            onChange={handleSliderChange}
            onPointerUp={handlePointerUp}
            onTouchEnd={handlePointerUp}
            className="w-full h-3 appearance-none bg-transparent cursor-pointer relative z-10 theme-slider-input"
            style={{
              "--slider-thumb":
                currentTheme === "sunset"
                  ? "#f97316"
                  : currentTheme === "dark"
                  ? "#818cf8"
                  : "#f59e0b",
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            clearTimer();
            sunsetJustUnlockedRef.current = false;
            setSliderValue(100);
            if (currentTheme !== "dark") onThemeChange?.("dark");
          }}
          className={`p-1 rounded-full transition-colors cursor-pointer ${
            currentTheme === "dark"
              ? "text-indigo-400 font-bold bg-indigo-500/10"
              : "text-muted-foreground/60 hover:text-foreground hover:bg-muted"
          }`}
          title="Switch to Dark Theme"
        >
          <Moon className="h-3.5 w-3.5" />
        </button>
      </div>

      <span className="text-[11px] font-medium text-muted-foreground">
        {currentTheme === "sunset" ? (
          <span className="text-orange-500 font-semibold flex items-center gap-1">
            🌅 Sunset Theme
          </span>
        ) : currentTheme === "dark" ? (
          "Dark Mode"
        ) : (
          "Light Mode"
        )}
      </span>
    </div>
  );
}
