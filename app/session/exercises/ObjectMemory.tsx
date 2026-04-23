"use client";

import { speak } from "@/lib/tts";
import { useState, useEffect } from "react";

interface Props {
  onDone: (skipped: boolean, score?: number, data?: Record<string, unknown>) => void;
  difficulty: number;
}

const OBJECTS = [
  { name: "苹果", emoji: "🍎" },
  { name: "杯子", emoji: "🥤" },
  { name: "猫", emoji: "🐱" },
  { name: "椅子", emoji: "🪑" },
  { name: "花", emoji: "🌸" },
  { name: "书", emoji: "📚" },
  { name: "鱼", emoji: "🐟" },
  { name: "钥匙", emoji: "🔑" },
  { name: "帽子", emoji: "🧢" },
  { name: "月亮", emoji: "🌙" },
  { name: "手机", emoji: "📱" },
  { name: "茶", emoji: "🍵" },
  { name: "碗", emoji: "🍜" },
  { name: "狗", emoji: "🐶" },
  { name: "树", emoji: "🌳" },
  { name: "灯", emoji: "💡" },
  { name: "手表", emoji: "⌚" },
  { name: "香蕉", emoji: "🍌" },
  { name: "眼镜", emoji: "👓" },
  { name: "雨伞", emoji: "☂️" },
  { name: "风扇", emoji: "🪭" },
  { name: "橙子", emoji: "🍊" },
  { name: "气球", emoji: "🎈" },
  { name: "钱包", emoji: "👛" },
  { name: "蜡烛", emoji: "🕯️" },
  { name: "西瓜", emoji: "🍉" },
  { name: "毛巾", emoji: "🧣" },
  { name: "葡萄", emoji: "🍇" },
  { name: "饼干", emoji: "🍪" },
  { name: "闹钟", emoji: "⏰" },
];

const SHOW_SECONDS = 5;

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

type Phase = "show" | "recall" | "result";

// difficulty 1 → 3 objects, 2 → 4 objects, 3 → 5 objects
export default function ObjectMemory({ onDone, difficulty }: Props) {
  const n = difficulty + 2;
  const [targets] = useState(() => pickRandom(OBJECTS, n));
  const [options] = useState(() => {
    const distractors = pickRandom(
      OBJECTS.filter((o) => !targets.includes(o)),
      3
    );
    return [...targets, ...distractors].sort(() => Math.random() - 0.5);
  });

  const [phase, setPhase] = useState<Phase>("show");
  const [timeLeft, setTimeLeft] = useState(SHOW_SECONDS);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    speak(`记住这${n}样东西：${targets.map((o) => o.name).join("，")}。${SHOW_SECONDS}秒后回答`);
    const iv = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(iv);
          setPhase("recall");
          setTimeout(() => speak(`好！你记得是哪${n}样东西吗？`), 300);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleSelect(name: string) {
    if (submitted) return;
    setSelected((prev) => {
      if (prev.includes(name)) return prev.filter((s) => s !== name);
      if (prev.length >= n) return prev;
      return [...prev, name];
    });
  }

  function handleSubmit() {
    setSubmitted(true);
    const correct = targets.filter((t) => selected.includes(t.name)).length;
    const score = Math.round((correct / n) * 100);
    const msg =
      correct === n
        ? `全对了！就是${targets.map((o) => o.name).join("、")}，记性真好！`
        : `答对了${correct}个。是${targets.map((o) => o.name).join("、")}，没关系继续加油！`;
    speak(msg);
    setTimeout(
      () => onDone(false, score, { targets: targets.map((o) => o.name), selected }),
      3000
    );
  }

  if (phase === "show") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8 max-w-lg mx-auto w-full">
        <div className="text-center">
          <h2 className="senior-text-xl text-amber-800 mb-1">记住这{n}样东西</h2>
          <p className="text-gray-500 text-xl">{timeLeft} 秒后翻面</p>
        </div>

        <div className="w-full h-3 bg-gray-200 rounded-full">
          <div
            className="h-3 bg-amber-400 rounded-full transition-all duration-1000"
            style={{ width: `${(timeLeft / SHOW_SECONDS) * 100}%` }}
          />
        </div>

        <div className="flex gap-4 justify-center w-full">
          {targets.map((obj) => (
            <div
              key={obj.name}
              className="flex-1 bg-white rounded-3xl shadow-lg p-6 flex flex-col items-center gap-3 border-2 border-amber-200"
            >
              <span className="text-7xl">{obj.emoji}</span>
              <span className="text-2xl font-bold text-amber-900">{obj.name}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-4 w-full">
          <button onClick={() => onDone(true)} className="flex-1 py-4 text-xl text-gray-400 border-2 border-gray-200 rounded-xl">
            跳过
          </button>
          <button
            onClick={() => { setPhase("recall"); speak(`好！你记得是哪${n}样东西吗？`); }}
            className="flex-2 flex-grow senior-btn bg-amber-500 text-white rounded-2xl text-2xl"
          >
            记住了 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6 max-w-lg mx-auto w-full">
      <div className="text-center">
        <h2 className="senior-text-xl text-amber-800 mb-1">刚才是哪{n}样？</h2>
        <p className="text-gray-500 text-xl">选出刚才看到的{n}样东西</p>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full">
        {options.map((obj) => {
          const isSelected = selected.includes(obj.name);
          const isCorrect = targets.some((t) => t.name === obj.name);
          let borderCls = "border-gray-200";
          if (submitted) {
            borderCls = isCorrect
              ? "border-green-400 bg-green-50"
              : isSelected
              ? "border-red-400 bg-red-50"
              : "border-gray-100 opacity-40";
          } else if (isSelected) {
            borderCls = "border-amber-400 bg-amber-50";
          }
          return (
            <button
              key={obj.name}
              onClick={() => toggleSelect(obj.name)}
              disabled={submitted || (!isSelected && selected.length >= n)}
              className={`border-2 rounded-2xl p-4 flex flex-col items-center gap-2 bg-white transition-all ${borderCls} disabled:opacity-40`}
            >
              <span className="text-5xl">{obj.emoji}</span>
              <span className="text-lg font-semibold text-gray-800">{obj.name}</span>
            </button>
          );
        })}
      </div>

      {!submitted && (
        <div className="flex gap-4 w-full">
          <button onClick={() => onDone(true)} className="flex-1 py-4 text-xl text-gray-400 border-2 border-gray-200 rounded-xl">
            跳过
          </button>
          <button
            onClick={handleSubmit}
            disabled={selected.length < n}
            className="flex-2 flex-grow senior-btn bg-amber-500 text-white rounded-2xl text-2xl disabled:opacity-40"
          >
            提交答案
          </button>
        </div>
      )}

      {submitted && (
        <p className="text-center text-2xl font-semibold text-green-700">稍等继续...</p>
      )}
    </div>
  );
}
