"use client";

import { speak } from "@/lib/tts";

import { useState, useEffect, useRef } from "react";

interface Props {
  onDone: (skipped: boolean, score?: number, data?: Record<string, unknown>) => void;
  difficulty: number;
}

type Phase = "show" | "recall" | "result";

const COLORS = [
  "bg-red-400",
  "bg-blue-400",
  "bg-green-400",
  "bg-yellow-400",
  "bg-purple-400",
  "bg-pink-400",
];

// difficulty 1 → 3-4 cells, 2 → 4-5 cells, 3 → 5-6 cells
const LIT_RANGES: Record<number, [number, number]> = { 1: [3, 4], 2: [4, 5], 3: [5, 6] };

function randomSubset(arr: number[], n: number): number[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export default function PatternMemory({ onDone, difficulty }: Props) {
  const SHOW_SECONDS = 5;
  const GRID_SIZE = 9; // 3×3

  const [litCells] = useState<number[]>(() => {
    const [lo, hi] = LIT_RANGES[difficulty] ?? [3, 4];
    const count = lo + Math.floor(Math.random() * (hi - lo + 1));
    return randomSubset(Array.from({ length: GRID_SIZE }, (_, i) => i), count);
  });

  const [cellColor] = useState<string>(
    () => COLORS[Math.floor(Math.random() * COLORS.length)]
  );

  const [phase, setPhase] = useState<Phase>("show");
  const [timeLeft, setTimeLeft] = useState(SHOW_SECONDS);
  const [selected, setSelected] = useState<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    speak(`图案记忆！请记住亮起来的格子，${SHOW_SECONDS}秒后回答`);
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!);
          setPhase("recall");
          speak("时间到！请选出刚才亮起的格子");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, []);

  function toggleCell(i: number) {
    if (phase !== "recall") return;
    setSelected((s) =>
      s.includes(i) ? s.filter((x) => x !== i) : [...s, i]
    );
  }

  function handleSubmit() {
    const correct = litCells.filter((c) => selected.includes(c)).length;
    const wrong = selected.filter((c) => !litCells.includes(c)).length;
    const score = Math.max(
      0,
      Math.round(((correct - wrong) / litCells.length) * 100)
    );
    speak(
      score >= 75
        ? "答对了！记性很好！"
        : score >= 40
        ? "不错！答对了一部分！"
        : "没关系，我们继续！"
    );
    setPhase("result");
    setTimeout(() => onDone(false, score, { litCells, selected }), 3000);
  }

  function getCellClass(i: number): string {
    const base = "w-full aspect-square rounded-2xl transition-all duration-200 border-4";

    if (phase === "show") {
      return litCells.includes(i)
        ? `${base} ${cellColor} border-white shadow-lg scale-105`
        : `${base} bg-gray-200 border-gray-200`;
    }

    if (phase === "recall") {
      return selected.includes(i)
        ? `${base} ${cellColor} border-white shadow-md`
        : `${base} bg-gray-100 border-gray-200 hover:bg-gray-200 active:scale-95 cursor-pointer`;
    }

    // result phase
    const wasLit = litCells.includes(i);
    const wasSelected = selected.includes(i);
    if (wasLit && wasSelected) return `${base} bg-green-400 border-green-600`; // correct
    if (wasLit && !wasSelected) return `${base} ${cellColor} border-white opacity-60`; // missed
    if (!wasLit && wasSelected) return `${base} bg-red-300 border-red-500`; // wrong
    return `${base} bg-gray-100 border-gray-200`;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6 max-w-sm mx-auto w-full">
      <div className="text-center">
        <h2 className="senior-text-xl text-amber-800 mb-1">图案记忆</h2>
        {phase === "show" && (
          <p className="text-gray-500 text-xl">
            记住亮起的格子 — {timeLeft} 秒
          </p>
        )}
        {phase === "recall" && (
          <p className="text-gray-500 text-xl">
            点出刚才亮起的 {litCells.length} 个格子
          </p>
        )}
        {phase === "result" && (
          <p className="text-gray-500 text-xl">正确答案已显示</p>
        )}
      </div>

      {/* 3×3 grid */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {Array.from({ length: GRID_SIZE }, (_, i) => (
          <button
            key={i}
            onClick={() => toggleCell(i)}
            className={getCellClass(i)}
            disabled={phase !== "recall"}
            style={{ minHeight: "90px" }}
          />
        ))}
      </div>

      {/* Timer bar during show phase */}
      {phase === "show" && (
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full transition-all duration-1000"
            style={{ width: `${(timeLeft / SHOW_SECONDS) * 100}%` }}
          />
        </div>
      )}

      {/* Result legend */}
      {phase === "result" && (
        <div className="flex gap-4 text-lg text-gray-600">
          <span className="flex items-center gap-1">
            <span className="w-5 h-5 rounded bg-green-400 inline-block" /> 答对
          </span>
          <span className="flex items-center gap-1">
            <span className="w-5 h-5 rounded bg-red-300 inline-block" /> 多选
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-5 h-5 rounded ${cellColor} inline-block opacity-60`} /> 漏选
          </span>
        </div>
      )}

      {/* Buttons */}
      {phase === "recall" && (
        <div className="flex gap-4 w-full">
          <button
            onClick={() => onDone(true)}
            className="flex-1 py-4 text-xl text-gray-400 border-2 border-gray-200 rounded-xl"
          >
            跳过
          </button>
          <button
            onClick={handleSubmit}
            disabled={selected.length === 0}
            className="flex-2 flex-grow senior-btn bg-amber-500 text-white rounded-2xl text-2xl disabled:opacity-40"
          >
            提交答案
          </button>
        </div>
      )}
    </div>
  );
}
