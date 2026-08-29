"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Settings, Flame, Coffee } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export default function PomodoroTimer() {
  // Durations stored in minutes
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);

  // Input states for the settings modal
  const [tempFocus, setTempFocus] = useState(25);
  const [tempBreak, setTempBreak] = useState(5);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Timer states
  const [mode, setMode] = useState("focus"); // "focus" | "break"
  const [timeLeft, setTimeLeft] = useState(25 * 60); // seconds
  const [isActive, setIsActive] = useState(false);

  const totalDuration = (mode === "focus" ? focusMinutes : breakMinutes) * 60;

  // Tick interval handler
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Auto-switch mode on complete
      const nextMode = mode === "focus" ? "break" : "focus";
      const nextDuration = (nextMode === "focus" ? focusMinutes : breakMinutes) * 60;
      setMode(nextMode);
      setTimeLeft(nextDuration);
      setIsActive(false);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, focusMinutes, breakMinutes]);

  // Mode tab change handler
  const handleModeChange = (newMode) => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft((newMode === "focus" ? focusMinutes : breakMinutes) * 60);
  };

  // Toggle play/pause
  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  // Reset timer to beginning of current mode
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft((mode === "focus" ? focusMinutes : breakMinutes) * 60);
  };

  // Save custom durations
  const handleSaveSettings = () => {
    const validFocus = Math.max(1, Number(tempFocus) || 25);
    const validBreak = Math.max(1, Number(tempBreak) || 5);

    setFocusMinutes(validFocus);
    setBreakMinutes(validBreak);

    // Update current active timer with new duration
    setIsActive(false);
    setTimeLeft((mode === "focus" ? validFocus : validBreak) * 60);
    setIsSettingsOpen(false);
  };

  // Format mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const progressPercentage = ((totalDuration - timeLeft) / totalDuration) * 100;

  return (
    <Card className="w-full h-full flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          {mode === "focus" ? (
            <>
              <Flame className="h-5 w-5 dark:text-white" /> Focus Session
            </>
          ) : (
            <>
              <Coffee className="h-5 w-5 dark:text-white" /> Break Time
            </>
          )}
        </CardTitle>

        {/* Settings Dialog - Fixed hydration button conflict */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
            <Settings className="h-4 w-4" />
          </DialogTrigger>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle>Timer Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="focus-input">Focus (minutes)</Label>
                <Input
                  id="focus-input"
                  type="number"
                  min="1"
                  max="120"
                  value={tempFocus}
                  onChange={(e) => setTempFocus(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="break-input">Break (minutes)</Label>
                <Input
                  id="break-input"
                  type="number"
                  min="1"
                  max="60"
                  value={tempBreak}
                  onChange={(e) => setTempBreak(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveSettings} className="w-full">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-6 text-center">
        {/* Focus / Break Switcher */}
        <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="focus">Focus</TabsTrigger>
            <TabsTrigger value="break">Break</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Timer Readout */}
        <div className="py-4">
          <span className="text-6xl font-mono font-bold tracking-tight text-foreground">
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-2" />
          <div className="text-xs text-muted-foreground ">
            <span>{Math.round(progressPercentage)}%</span>
          </div>
        </div>
      </CardContent>

      {/* Control Buttons */}
      <CardFooter className="flex justify-center gap-3">
        <Button
          size="lg"
          variant={isActive ? "secondary" : "default"}
          onClick={toggleTimer}
          className="w-32"
        >
          {isActive ? (
            <>
              <Pause className="mr-2 h-4 w-4" /> Pause
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" /> Start
            </>
          )}
        </Button>

        <Button size="lg" variant="outline" onClick={resetTimer}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}