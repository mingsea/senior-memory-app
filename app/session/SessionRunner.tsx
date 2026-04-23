"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startSession, recordAttempt, completeSession } from "@/lib/actions/session";
import type { ExerciseType } from "@/lib/exercises/configs";
import { isTTSSupported, unlockTTS, speak } from "@/lib/tts";

import ObjectMemory from "./exercises/ObjectMemory";
import PatternMemory from "./exercises/PatternMemory";
import CardMemory from "./exercises/CardMemory";
import CommonSense from "./exercises/CommonSense";

interface Props {
  seniorName: string;
}

type Phase = "unlock" | "loading" | "exercise" | "mood" | "done";

const MOOD_OPTIONS = [
  { value: "HAPPY", emoji: "😊", label: "很好" },
  { value: "OK", emoji: "😐", label: "还好" },
  { value: "SAD", emoji: "😔", label: "不太好" },
];

export default function SessionRunner({ seniorName }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("unlock");
  const [sessionId, setSessionId] = useState("");
  const [exercises, setExercises] = useState<ExerciseType[]>([]);
  const [difficulties, setDifficulties] = useState<Record<ExerciseType, number>>({} as Record<ExerciseType, number>);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState("");
  const [voiceChecked, setVoiceChecked] = useState(false);
  const [ttsSupported, setTtsSupported] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();
  const [manualDifficulty, setManualDifficulty] = useState<number | null>(null);
  const advancingRef = useRef(false);

  useEffect(() => {
    setTtsSupported(isTTSSupported());
  }, []);

  function handleVoiceTest() {
    setError("");
    startTransition(async () => {
      const ok = await unlockTTS();
      if (!ok) {
        setError("当前浏览器不支持语音播放");
        return;
      }
      setVoiceChecked(true);
      speak("您好，现在开始语音测试。听到声音说明已经正常。");
    });
  }

  function handleUnlock() {
    setPhase("loading");
    setError("");
    startTransition(async () => {
      try {
        const ok = await unlockTTS();
        if (!ok) {
          throw new Error("当前浏览器不支持语音播放");
        }
        setVoiceChecked(true);
        const result = await startSession(manualDifficulty ?? undefined);
        if (result.exercises.length === 0) {
          throw new Error("当前没有可用练习");
        }
        setSessionId(result.sessionId);
        setExercises(result.exercises);
        setDifficulties(result.difficulties);
        setCurrentIndex(0);
        setPhase("exercise");
        speak("开始练习，加油！");
      } catch {
        setError("暂时无法开始练习或打开语音，请稍后再试");
        setPhase("unlock");
      }
    });
  }

  async function handleExerciseDone(
    skipped: boolean,
    scorePercent?: number,
    responseData?: Record<string, unknown>
  ) {
    if (advancingRef.current) return;
    advancingRef.current = true;
    try {
      await recordAttempt({
        sessionId,
        exerciseType: exercises[currentIndex],
        skipped,
        scorePercent,
        responseData,
      });

      if (currentIndex + 1 >= exercises.length) {
        setPhase("mood");
        setTimeout(() => speak("太棒了！今天的练习完成了！"), 300);
      } else {
        setCurrentIndex((i) => i + 1);
        advancingRef.current = false;
      }
    } catch {
      advancingRef.current = false;
      setError("练习保存失败，请返回主页后重试");
      setPhase("done");
    }
  }

  async function handleMood(mood: string) {
    startTransition(async () => {
      try {
        await completeSession(sessionId, mood);
        setPhase("done");
        setTimeout(() => speak("谢谢！今天辛苦了，好好休息！"), 300);
      } catch {
        setError("保存今天的心情失败，但可以先回到主页");
        setPhase("done");
      }
    });
  }

  function renderExercise() {
    const type = exercises[currentIndex];
    const difficulty = difficulties[type] ?? 1;
    const props = { onDone: handleExerciseDone, difficulty };

    switch (type) {
      case "CARD_MEMORY": return <CardMemory key={currentIndex} {...props} />;
      case "PATTERN_MEMORY": return <PatternMemory key={currentIndex} {...props} />;
      case "OBJECT_MEMORY": return <ObjectMemory key={currentIndex} {...props} />;
      case "COMMON_SENSE": return <CommonSense key={currentIndex} {...props} />;
      default: return null;
    }
  }

  if (phase === "unlock") {
    const DIFFICULTY_OPTIONS = [
      { value: 1, label: "容易", emoji: "🌱", color: "border-green-400 bg-green-50 text-green-800" },
      { value: 2, label: "普通", emoji: "⭐", color: "border-amber-400 bg-amber-50 text-amber-800" },
      { value: 3, label: "困难", emoji: "🔥", color: "border-red-400 bg-red-50 text-red-800" },
    ];
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50 p-8 gap-8">
        <div className="text-center">
          <div className="text-7xl mb-4">🧠</div>
          <h1 className="text-4xl font-bold text-amber-800 mb-2">准备好了吗？</h1>
          <p className="text-2xl text-gray-500">先试试听声音，再开始练习</p>
        </div>

        <div className="w-full max-w-sm">
          <p className="text-2xl font-semibold text-gray-700 text-center mb-4">选择难度</p>
          <div className="flex gap-3">
            {DIFFICULTY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setManualDifficulty(manualDifficulty === opt.value ? null : opt.value)}
                className={`flex-1 py-5 rounded-2xl border-2 text-center transition-all ${
                  manualDifficulty === opt.value
                    ? opt.color + " border-4 shadow-md scale-105"
                    : "border-gray-200 bg-white text-gray-600"
                }`}
              >
                <div className="text-4xl mb-1">{opt.emoji}</div>
                <div className="text-xl font-bold">{opt.label}</div>
              </button>
            ))}
          </div>
          {manualDifficulty === null && (
            <p className="text-center text-lg text-gray-400 mt-2">不选则按上次成绩自动调整</p>
          )}
        </div>

        <button
          onClick={handleVoiceTest}
          disabled={isPending || ttsSupported === false}
          className="senior-btn bg-white text-amber-700 border-2 border-amber-300 px-16 py-6 text-3xl rounded-3xl shadow-sm"
        >
          {voiceChecked ? "🔊 再听一次" : "🔊 测试声音"}
        </button>
        <button
          onClick={handleUnlock}
          disabled={isPending}
          className="senior-btn bg-green-500 text-white px-16 py-8 text-4xl rounded-3xl shadow-xl"
          style={{ minHeight: "120px" }}
        >
          {isPending ? "准备中..." : "🔊 开始练习"}
        </button>
        {error && (
          <div className="max-w-sm rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center text-lg text-red-700">
            {error}
          </div>
        )}
        {ttsSupported === false && (
          <div className="max-w-sm rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-center text-lg text-amber-800">
            当前浏览器不支持语音朗读，请换用 Safari 或 Chrome 再试。
          </div>
        )}
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-2xl text-gray-600">准备中...</p>
        </div>
      </div>
    );
  }

  if (phase === "mood") {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-8 gap-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold text-green-700 mb-2">
            今天练习完成了！
          </h1>
          <p className="text-2xl text-gray-600">
            完成了 {exercises.length} 个练习
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-sm text-center">
          <p className="text-2xl font-semibold text-gray-700 mb-6">
            你今天感觉怎么样？
          </p>
          <div className="flex justify-center gap-6">
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.value}
                onClick={() => handleMood(m.value)}
                disabled={isPending}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-gray-50 active:scale-95 transition-transform"
              >
                <span className="text-5xl">{m.emoji}</span>
                <span className="text-xl font-medium text-gray-700">
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-8 gap-8">
        <div className="text-center">
          <div className="text-7xl mb-4">🌟</div>
          <h1 className="text-4xl font-bold text-green-700 mb-2">做得很好！</h1>
          <p className="text-2xl text-gray-600">今天的练习已经保存</p>
        </div>
        <button
          onClick={() => router.push("/home")}
          className="senior-btn bg-amber-500 text-white px-12 py-6 text-3xl rounded-3xl shadow-lg"
        >
          回到主页
        </button>
        {error && (
          <div className="max-w-sm rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center text-lg text-red-700">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Exercise phase
  return (
    <div className="min-h-screen bg-amber-50 flex flex-col">
      {/* Progress bar */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between text-gray-500 mb-2 text-lg">
            <span>练习 {currentIndex + 1} / {exercises.length}</span>
            <span>{seniorName}</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full">
            <div
              className="h-3 bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / exercises.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Exercise content */}
      <div className="flex-1 flex flex-col">
        {renderExercise()}
      </div>
    </div>
  );
}
