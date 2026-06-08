"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Settings, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";

type ActivePlayer = 1 | 2;

function formatTime(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function ChessClockPage() {
  const [timePerPerson, setTimePerPerson] = useState(10); // minutes
  const [increment, setIncrement] = useState(0); // seconds

  const [player1Time, setPlayer1Time] = useState(10 * 60 * 1000);
  const [player2Time, setPlayer2Time] = useState(10 * 60 * 1000);
  const [activePlayer, setActivePlayer] = useState<ActivePlayer>(1);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Temp values for the settings dialog so we only apply on close
  const [tempTime, setTempTime] = useState(10);
  const [tempIncrement, setTempIncrement] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const acquireWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch {
      // Wake Lock API not supported or request failed (e.g. low battery)
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  }, []);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const now = Date.now();
    const elapsed = now - lastTickRef.current;
    lastTickRef.current = now;

    if (activePlayer === 1) {
      setPlayer1Time((prev) => {
        const next = prev - elapsed;
        if (next <= 0) {
          stopInterval();
          setIsRunning(false);
          setIsFinished(true);
          return 0;
        }
        return next;
      });
    } else {
      setPlayer2Time((prev) => {
        const next = prev - elapsed;
        if (next <= 0) {
          stopInterval();
          setIsRunning(false);
          setIsFinished(true);
          return 0;
        }
        return next;
      });
    }
  }, [activePlayer, stopInterval]);

  useEffect(() => {
    if (isRunning) {
      lastTickRef.current = Date.now();
      intervalRef.current = setInterval(tick, 50);
    } else {
      stopInterval();
    }
    return stopInterval;
  }, [isRunning, tick, stopInterval]);

  // Acquire/release wake lock when running state changes
  useEffect(() => {
    if (isRunning) {
      acquireWakeLock();
    } else {
      releaseWakeLock();
    }
    return releaseWakeLock;
  }, [isRunning, acquireWakeLock, releaseWakeLock]);

  // Re-acquire wake lock when tab becomes visible again (browser releases it on hide)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isRunning) {
        acquireWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isRunning, acquireWakeLock]);

  const handlePlayerTap = (player: ActivePlayer) => {
    if (isFinished) return;

    // If clock hasn't started yet, tapping a side starts the
    // OTHER player's clock (chess convention: you hit your clock
    // after making your move, starting opponent's time)
    if (!hasStarted) {
      const opponent: ActivePlayer = player === 1 ? 2 : 1;
      setActivePlayer(opponent);
      setHasStarted(true);
      setIsRunning(true);
      return;
    }

    if (!isRunning) return;
    if (activePlayer !== player) return;

    // Add increment to the player who just moved
    const incrementMs = increment * 1000;
    if (player === 1) {
      setPlayer1Time((prev) => prev + incrementMs);
    } else {
      setPlayer2Time((prev) => prev + incrementMs);
    }

    // Switch active player
    setActivePlayer(player === 1 ? 2 : 1);
  };

  const handlePauseOrReset = () => {
    if (isRunning) {
      // Pause
      setIsRunning(false);
    } else if (hasStarted) {
      // Reset timers to current settings
      stopInterval();
      const timeMs = timePerPerson * 60 * 1000;
      setPlayer1Time(timeMs);
      setPlayer2Time(timeMs);
      setActivePlayer(1);
      setIsRunning(false);
      setIsFinished(false);
      setHasStarted(false);
    }
  };

  const openSettings = () => {
    // Pause clock when opening settings
    setIsRunning(false);
    setTempTime(timePerPerson);
    setTempIncrement(increment);
    setSettingsOpen(true);
  };

  const handleSettingsClose = (open: boolean) => {
    if (!open) {
      // Apply settings and reset timers
      const newTime = Math.max(1, tempTime);
      const newIncrement = Math.max(0, tempIncrement);
      setTimePerPerson(newTime);
      setIncrement(newIncrement);
      const timeMs = newTime * 60 * 1000;
      setPlayer1Time(timeMs);
      setPlayer2Time(timeMs);
      setActivePlayer(1);
      setIsRunning(false);
      setIsFinished(false);
      setHasStarted(false);
    }
    setSettingsOpen(open);
  };

  const timeControlLabel = `${timePerPerson}+${increment}`;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Player 2 (top, displayed upside down for face-to-face play) */}
      <button
        onClick={() => handlePlayerTap(2)}
        className={`flex-1 flex items-center justify-center transition-colors select-none ${
          isFinished && player2Time <= 0
            ? "bg-destructive/20 text-destructive"
            : activePlayer === 2 && hasStarted
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        } ${!isFinished ? "cursor-pointer active:opacity-80" : ""}`}
      >
        <div className="rotate-180">
          <div className="text-7xl font-mono font-bold tabular-nums">
            {formatTime(player2Time)}
          </div>
          {isFinished && player2Time <= 0 && (
            <div className="text-center text-sm mt-2 font-medium">
              Time&apos;s up!
            </div>
          )}
        </div>
      </button>

      {/* Middle control bar */}
      <div className="flex items-center justify-between px-6 py-3 border-y bg-background">
        <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Back
        </Link>

        {hasStarted && (
          <Button
            onClick={handlePauseOrReset}
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            aria-label={isRunning ? "Pause" : "Reset"}
          >
            {isRunning ? (
              <Pause className="h-5 w-5" />
            ) : (
              <RotateCcw className="h-5 w-5" />
            )}
          </Button>
        )}

        <button
          onClick={openSettings}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Edit time control"
        >
          <span className="font-mono">{timeControlLabel}</span>
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Player 1 (bottom) */}
      <button
        onClick={() => handlePlayerTap(1)}
        className={`flex-1 flex items-center justify-center transition-colors select-none ${
          isFinished && player1Time <= 0
            ? "bg-destructive/20 text-destructive"
            : activePlayer === 1 && hasStarted
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        } ${!isFinished ? "cursor-pointer active:opacity-80" : ""}`}
      >
        <div>
          <div className="text-7xl font-mono font-bold tabular-nums">
            {formatTime(player1Time)}
          </div>
          {isFinished && player1Time <= 0 && (
            <div className="text-center text-sm mt-2 font-medium">
              Time&apos;s up!
            </div>
          )}
        </div>
      </button>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={handleSettingsClose}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Clock Settings</DialogTitle>
            <DialogDescription>
              Changing settings will reset the timers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Time per person (minutes)
              </label>
              <Input
                type="number"
                min={1}
                max={180}
                value={tempTime}
                onChange={(e) =>
                  setTempTime(Math.max(1, parseInt(e.target.value) || 1))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Increment (seconds)
              </label>
              <Input
                type="number"
                min={0}
                max={60}
                value={tempIncrement}
                onChange={(e) =>
                  setTempIncrement(Math.max(0, parseInt(e.target.value) || 0))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button className="w-full">Confirm</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
