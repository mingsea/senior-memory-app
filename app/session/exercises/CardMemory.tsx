"use client";

import { speak } from "@/lib/tts";
import { useState, useEffect, useRef } from "react";

interface Props {
  onDone: (skipped: boolean, score?: number, data?: Record<string, unknown>) => void;
  difficulty: number;
}

const SUITS = ["♠", "♥", "♦", "♣"] as const;
const SUIT_NAMES: Record<string, string> = { "♠": "黑桃", "♥": "红心", "♦": "方块", "♣": "梅花" };
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SHOW_SECONDS = 5;

// difficulty 1 → 2 cards, 2 → 3 cards, 3 → 4 cards
function targetCount(difficulty: number) { return difficulty + 1; }

interface Card { suit: string; value: string }

function label(c: Card) { return `${SUIT_NAMES[c.suit]}${c.value}`; }
function isRed(c: Card) { return c.suit === "♥" || c.suit === "♦"; }

function buildDeck(): Card[] {
  return SUITS.flatMap(suit => VALUES.map(value => ({ suit, value })));
}

function pickN(deck: Card[], n: number, exclude: Card[]): Card[] {
  const pool = deck.filter(c => !exclude.some(e => e.suit === c.suit && e.value === c.value));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

type Phase = "show" | "recall" | "result";

function CardFace({ card }: { card: Card }) {
  const red = isRed(card);
  return (
    <div className="bg-white border-2 border-gray-300 rounded-2xl shadow-lg flex flex-col items-center justify-center w-28 h-44 select-none">
      <p className={`text-4xl font-bold ${red ? "text-red-500" : "text-gray-900"}`}>{card.value}</p>
      <p className={`text-5xl leading-none ${red ? "text-red-500" : "text-gray-900"}`}>{card.suit}</p>
    </div>
  );
}

function CardBack() {
  return (
    <div className="bg-blue-700 border-2 border-blue-900 rounded-2xl shadow-lg flex items-center justify-center w-28 h-44">
      <div className="w-20 h-36 border-2 border-blue-400 rounded-xl flex items-center justify-center">
        <p className="text-white text-3xl">✦</p>
      </div>
    </div>
  );
}

export default function CardMemory({ onDone, difficulty }: Props) {
  const n = targetCount(difficulty);
  const deck = useRef(buildDeck());
  const [targets] = useState<Card[]>(() => pickN(deck.current, n, []));
  const [options] = useState<Card[]>(() => {
    const distractors = pickN(deck.current, Math.max(4, n + 2), targets);
    return [...targets, ...distractors].sort(() => Math.random() - 0.5);
  });

  const [phase, setPhase] = useState<Phase>("show");
  const [timeLeft, setTimeLeft] = useState(SHOW_SECONDS);
  const [selected, setSelected] = useState<Card[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (phase !== "show") return;
    speak(`记住这${n}张牌！${targets.map(label).join("，")}`);
    const iv = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(iv);
          setPhase("recall");
          setTimeout(() => speak(`好！你还记得是哪${n}张牌吗？`), 300);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleSelect(card: Card) {
    if (submitted) return;
    setSelected(prev => {
      const already = prev.some(c => c.suit === card.suit && c.value === card.value);
      if (already) return prev.filter(c => !(c.suit === card.suit && c.value === card.value));
      if (prev.length >= n) return prev;
      return [...prev, card];
    });
  }

  function handleSubmit() {
    setSubmitted(true);
    const correct = targets.filter(t => selected.some(s => s.suit === t.suit && s.value === t.value)).length;
    const score = Math.round((correct / n) * 100);
    const msg = correct === n
      ? `全对了！就是${targets.map(label).join("和")}！太厉害了！`
      : `答对了${correct}张。是${targets.map(label).join("和")}，没关系继续加油！`;
    speak(msg);
    setTimeout(() => onDone(false, score, { targets: targets.map(label), selected: selected.map(label) }), 3000);
  }

  if (phase === "show") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8 max-w-lg mx-auto w-full">
        <div className="text-center">
          <h2 className="senior-text-xl text-amber-800 mb-1">记住这{n}张牌</h2>
          <p className="text-gray-500 text-xl">{timeLeft} 秒后翻面</p>
        </div>

        <div className="w-full h-3 bg-gray-200 rounded-full">
          <div className="h-3 bg-amber-400 rounded-full transition-all duration-1000" style={{ width: `${(timeLeft / SHOW_SECONDS) * 100}%` }} />
        </div>

        <div className="flex gap-4 justify-center flex-wrap">
          {targets.map((card, i) => <CardFace key={i} card={card} />)}
        </div>

        <div className="flex gap-4 w-full">
          <button onClick={() => onDone(true)} className="flex-1 py-4 text-xl text-gray-400 border-2 border-gray-200 rounded-xl">跳过</button>
          <button onClick={() => { setPhase("recall"); speak(`好！你还记得是哪${n}张牌吗？`); }} className="flex-2 flex-grow senior-btn bg-amber-500 text-white rounded-2xl text-2xl">
            记住了 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6 max-w-lg mx-auto w-full">
      <div className="text-center">
        <h2 className="senior-text-xl text-amber-800 mb-1">刚才是哪{n}张？</h2>
        <p className="text-gray-500 text-xl">选出刚才看到的{n}张牌</p>
      </div>

      <div className="flex gap-4 justify-center flex-wrap">
        {targets.map((_, i) => <CardBack key={i} />)}
      </div>

      <div className="grid grid-cols-3 gap-3 w-full">
        {options.map((card, i) => {
          const isSelected = selected.some(s => s.suit === card.suit && s.value === card.value);
          const isCorrect = targets.some(t => t.suit === card.suit && t.value === card.value);
          let borderCls = "border-gray-200";
          if (submitted) {
            borderCls = isCorrect ? "border-green-400 bg-green-50" : isSelected ? "border-red-400 bg-red-50" : "border-gray-100 opacity-40";
          } else if (isSelected) {
            borderCls = "border-amber-400 bg-amber-50";
          }
          return (
            <button key={i} onClick={() => toggleSelect(card)} disabled={submitted || (!isSelected && selected.length >= n)}
              className={`border-2 rounded-2xl p-2 flex flex-col items-center justify-center bg-white transition-all ${borderCls} disabled:opacity-40`}>
              <CardFace card={card} />
            </button>
          );
        })}
      </div>

      {!submitted && (
        <div className="flex gap-4 w-full">
          <button onClick={() => onDone(true)} className="flex-1 py-4 text-xl text-gray-400 border-2 border-gray-200 rounded-xl">跳过</button>
          <button onClick={handleSubmit} disabled={selected.length < n}
            className="flex-2 flex-grow senior-btn bg-amber-500 text-white rounded-2xl text-2xl disabled:opacity-40">
            提交答案
          </button>
        </div>
      )}
      {submitted && <p className="text-center text-2xl font-semibold text-green-700">稍等继续...</p>}
    </div>
  );
}
