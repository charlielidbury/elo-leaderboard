"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Play, Pause, RotateCcw } from "lucide-react";
import Link from "next/link";

type ClockState = "idle" | "running" | "paused" | "finished";
type ActivePlayer = 1 | 2;

function formatTime(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function ChessClockPage() {
  const [timePerPerson, setTimePerPerson] = useState(5); // minutes
  const [increment, setIncrement] = useState(3); // seconds

  const [player1Time, setPlayer1Time] = useState(5 * 60 * 1000);
  const [player2Time, setPlayer2Time] = useState(5 * 60 * 1000);
  const [activePlayer, setActivePlayer] = useState<ActivePlayer>(1);
  const [clockState, setClockState] = useState<ClockState>("idle");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(0);

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
          setClockState("finished");
          return 0;
        }
        return next;
      });
    } else {
      setPlayer2Time((prev) => {
        const next = prev - elapsed;
        if (next <= 0) {
          stopInterval();
          setClockState("finished");
          return 0;
        }
        return next;
      });
    }
  }, [activePlayer, stopInterval]);

  useEffect(() => {
    if (clockState === "running") {
      lastTickRef.current = Date.now();
      intervalRef.current = setInterval(tick, 50);
    } else {
      stopInterval();
    }
    return stopInterval;
  }, [clockState, tick, stopInterval]);

  const handleStart = () => {
    if (clockState === "idle") {
      const timeMs = timePerPerson * 60 * 1000;
      setPlayer1Time(timeMs);
      setPlayer2Time(timeMs);
      setActivePlayer(1);
      setClockState("running");
    } else if (clockState === "paused") {
      setClockState("running");
    }
  };

  const handlePause = () => {
    if (clockState === "running") {
      setClockState("paused");
    }
  };

  const handleReset = () => {
    stopInterval();
    const timeMs = timePerPerson * 60 * 1000;
    setPlayer1Time(timeMs);
    setPlayer2Time(timeMs);
    setActivePlayer(1);
    setClockState("idle");
  };

  const handlePlayerTap = (player: ActivePlayer) => {
    if (clockState !== "running") return;
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

  const isIdle = clockState === "idle";
  const isRunning = clockState === "running";
  const isFinished = clockState === "finished";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-lg font-bold">Chess Clock</h1>
        <div className="w-20" />
      </div>

      {/* Settings (only when idle) */}
      {isIdle && (
        <div className="p-4 space-y-4 max-w-sm mx-auto w-full">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Time per person (minutes)
            </label>
            <Input
              type="number"
              min={1}
              max={180}
              value={timePerPerson}
              onChange={(e) => setTimePerPerson(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Increment (seconds)
            </label>
            <Input
              type="number"
              min={0}
              max={60}
              value={increment}
              onChange={(e) => setIncrement(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>
        </div>
      )}

      {/* Timer displays */}
      <div className="flex-1 flex flex-col gap-2 p-4">
        {/* Player 2 (top, displayed upside down for face-to-face play) */}
        <button
          onClick={() => handlePlayerTap(2)}
          disabled={!isRunning || activePlayer !== 2}
          className={`flex-1 rounded-2xl flex items-center justify-center transition-colors select-none ${
            isFinished && player2Time <= 0
              ? "bg-destructive/20 text-destructive"
              : activePlayer === 2 && !isIdle
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          } ${isRunning && activePlayer === 2 ? "cursor-pointer active:opacity-80" : ""}`}
          style={{ minHeight: "30vh" }}
        >
          <div className="rotate-180">
            <div className="text-6xl font-mono font-bold tabular-nums">
              {formatTime(player2Time)}
            </div>
            <div className="text-center text-sm mt-2 opacity-70">
              Player 2 {activePlayer === 2 && isRunning && "(tap)"}
            </div>
          </div>
        </button>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 py-2">
          {(isIdle || clockState === "paused") && (
            <Button onClick={handleStart} size="lg" className="gap-2">
              <Play className="h-5 w-5" />
              {isIdle ? "Start" : "Resume"}
            </Button>
          )}
          {isRunning && (
            <Button onClick={handlePause} variant="secondary" size="lg" className="gap-2">
              <Pause className="h-5 w-5" />
              Pause
            </Button>
          )}
          {!isIdle && (
            <Button onClick={handleReset} variant="outline" size="lg" className="gap-2">
              <RotateCcw className="h-5 w-5" />
              Reset
            </Button>
          )}
          {isFinished && (
            <span className="text-sm font-medium text-destructive ml-2">
              {player1Time <= 0 ? "Player 1" : "Player 2"} ran out of time!
            </span>
          )}
        </div>

        {/* Player 1 (bottom) */}
        <button
          onClick={() => handlePlayerTap(1)}
          disabled={!isRunning || activePlayer !== 1}
          className={`flex-1 rounded-2xl flex items-center justify-center transition-colors select-none ${
            isFinished && player1Time <= 0
              ? "bg-destructive/20 text-destructive"
              : activePlayer === 1 && !isIdle
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          } ${isRunning && activePlayer === 1 ? "cursor-pointer active:opacity-80" : ""}`}
          style={{ minHeight: "30vh" }}
        >
          <div>
            <div className="text-6xl font-mono font-bold tabular-nums">
              {formatTime(player1Time)}
            </div>
            <div className="text-center text-sm mt-2 opacity-70">
              Player 1 {activePlayer === 1 && isRunning && "(tap)"}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
