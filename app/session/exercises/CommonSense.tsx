"use client";

import { speak } from "@/lib/tts";
import { useState, useEffect } from "react";

interface Props {
  onDone: (skipped: boolean, score?: number, data?: Record<string, unknown>) => void;
  difficulty: number;
}

interface Question {
  q: string;
  options: string[];
  answer: string;
  level: number; // 1=easy, 2=medium, 3=hard
}

const QUESTIONS: Question[] = [
  // level 1 — 节日 & 基础常识
  { q: "一年有几个月？", options: ["10个月", "11个月", "12个月", "13个月"], answer: "12个月", level: 1 },
  { q: "一周有几天？", options: ["5天", "6天", "7天", "8天"], answer: "7天", level: 1 },
  { q: "太阳从哪个方向升起？", options: ["西边", "南边", "北边", "东边"], answer: "东边", level: 1 },
  { q: "中秋节吃什么？", options: ["饺子", "粽子", "月饼", "汤圆"], answer: "月饼", level: 1 },
  { q: "端午节吃什么？", options: ["月饼", "粽子", "汤圆", "年糕"], answer: "粽子", level: 1 },
  { q: "元宵节吃什么？", options: ["年糕", "粽子", "饺子", "汤圆"], answer: "汤圆", level: 1 },
  { q: "中国的首都是哪个城市？", options: ["上海", "北京", "广州", "南京"], answer: "北京", level: 1 },
  { q: "长城建在哪个国家？", options: ["日本", "韩国", "中国", "印度"], answer: "中国", level: 1 },
  { q: "日本的首都是？", options: ["大阪", "京都", "东京", "名古屋"], answer: "东京", level: 1 },
  { q: "法国的首都是？", options: ["柏林", "伦敦", "罗马", "巴黎"], answer: "巴黎", level: 1 },
  { q: "水在100度时会变成什么？", options: ["冰", "雪", "雾", "水蒸气"], answer: "水蒸气", level: 1 },
  { q: "中国国旗是什么颜色的？", options: ["蓝色和白色", "红色和黄色", "绿色和红色", "黄色和白色"], answer: "红色和黄色", level: 1 },
  // level 2 — 历史 & 地理
  { q: "中国最长的河流是？", options: ["黄河", "珠江", "长江", "淮河"], answer: "长江", level: 2 },
  { q: "天安门广场在哪个城市？", options: ["上海", "西安", "北京", "成都"], answer: "北京", level: 2 },
  { q: "故宫又叫什么？", options: ["颐和园", "紫禁城", "圆明园", "避暑山庄"], answer: "紫禁城", level: 2 },
  { q: "中国的国花是？", options: ["玫瑰", "梅花", "牡丹", "荷花"], answer: "牡丹", level: 2 },
  { q: "中华人民共和国成立于哪一年？", options: ["1945年", "1949年", "1952年", "1937年"], answer: "1949年", level: 2 },
  { q: "兵马俑在哪个城市？", options: ["北京", "洛阳", "西安", "南京"], answer: "西安", level: 2 },
  { q: "世界上最高的山是？", options: ["华山", "泰山", "珠穆朗玛峰", "昆仑山"], answer: "珠穆朗玛峰", level: 2 },
  { q: "非洲最长的河流是？", options: ["亚马逊河", "密西西比河", "尼罗河", "黄河"], answer: "尼罗河", level: 2 },
  { q: "美国的首都是？", options: ["纽约", "洛杉矶", "华盛顿", "芝加哥"], answer: "华盛顿", level: 2 },
  { q: "世界上面积最大的国家是？", options: ["中国", "美国", "俄罗斯", "加拿大"], answer: "俄罗斯", level: 2 },
  { q: "黄河被称为中国的什么？", options: ["母亲河", "生命线", "龙脉", "血脉"], answer: "母亲河", level: 2 },
  { q: "上海位于中国的哪个方向？", options: ["西部", "北部", "东部", "南部"], answer: "东部", level: 2 },
  // level 3 — 较难历史 & 地理
  { q: "秦始皇是哪个朝代的皇帝？", options: ["汉朝", "唐朝", "秦朝", "明朝"], answer: "秦朝", level: 3 },
  { q: "四大发明不包括以下哪项？", options: ["火药", "指南针", "印刷术", "蒸汽机"], answer: "蒸汽机", level: 3 },
  { q: "唐朝的首都是？", options: ["洛阳", "长安", "开封", "南京"], answer: "长安", level: 3 },
  { q: "中国最大的淡水湖是？", options: ["洞庭湖", "太湖", "鄱阳湖", "西湖"], answer: "鄱阳湖", level: 3 },
  { q: "中国有多少个省份？", options: ["23个", "34个", "28个", "31个"], answer: "34个", level: 3 },
  { q: "澳大利亚的首都是？", options: ["悉尼", "墨尔本", "堪培拉", "布里斯班"], answer: "堪培拉", level: 3 },
  { q: "哪个大洲没有常住居民？", options: ["大洋洲", "非洲", "南极洲", "北美洲"], answer: "南极洲", level: 3 },
  { q: "台湾岛位于中国的哪个方向？", options: ["西边", "北边", "南边", "东南边"], answer: "东南边", level: 3 },
  { q: "喜马拉雅山脉位于哪两个国家之间？", options: ["中国和俄罗斯", "中国和印度", "印度和伊朗", "中国和日本"], answer: "中国和印度", level: 3 },
  { q: "北京著名的鸟巢是什么建筑？", options: ["火车站", "博物馆", "奥运场馆", "购物中心"], answer: "奥运场馆", level: 3 },
];

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export default function CommonSense({ onDone, difficulty }: Props) {
  const [question] = useState<Question>(() => {
    const pool = QUESTIONS.filter((q) => q.level === difficulty);
    return pickRandom(pool.length > 0 ? pool : QUESTIONS, 1)[0];
  });
  const [shuffledOptions] = useState(() =>
    [...question.options].sort(() => Math.random() - 0.5)
  );
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    speak(`常识问答！${question.q}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelect(opt: string) {
    if (selected !== null) return;
    setSelected(opt);
    const correct = opt === question.answer;
    speak(correct ? `答对了！是${question.answer}！` : `答案是${question.answer}，没关系继续加油！`);
    setTimeout(
      () => onDone(false, correct ? 100 : 0, { question: question.q, selected: opt, answer: question.answer }),
      2500
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8 max-w-lg mx-auto w-full">
      <div className="text-center">
        <h2 className="senior-text-xl text-amber-800 mb-2">常识问答</h2>
      </div>

      <div
        className="bg-amber-100 rounded-3xl shadow-lg p-8 w-full text-center cursor-pointer"
        onClick={() => speak(question.q)}
      >
        <p className="senior-text text-amber-900">{question.q}</p>
        <p className="text-gray-500 text-xl mt-3">点击再听一遍 🔊</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        {shuffledOptions.map((opt) => {
          const isCorrect = opt === question.answer;
          const isSelected = opt === selected;
          let cls = "border-gray-200 bg-white text-gray-800";
          if (selected !== null) {
            if (isCorrect) cls = "border-green-400 bg-green-50 text-green-800";
            else if (isSelected) cls = "border-red-400 bg-red-50 text-red-800";
            else cls = "border-gray-100 bg-white text-gray-400 opacity-50";
          }
          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={selected !== null}
              className={`border-2 rounded-2xl p-5 text-2xl font-semibold transition-all ${cls} disabled:cursor-default`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {selected === null && (
        <button
          onClick={() => onDone(true)}
          className="w-full py-4 text-xl text-gray-400 border-2 border-gray-200 rounded-xl"
        >
          跳过
        </button>
      )}

      {selected !== null && (
        <p className="text-center text-2xl font-semibold text-green-700">稍等继续...</p>
      )}
    </div>
  );
}
