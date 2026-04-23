"use client";

import { useState, useTransition } from "react";
import { login } from "@/lib/actions/auth";

const PIN_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "清除", "0", "删除"];

export default function LoginClient() {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleKey(key: string) {
    if (key === "清除") {
      setPin("");
    } else if (key === "删除") {
      setPin((p) => p.slice(0, -1));
    } else {
      setPin((p) => (p.length < 6 ? p + key : p));
    }
  }

  function handleSubmit() {
    if (!username || !pin) {
      setError("请输入用户名和密码");
      return;
    }
    setError("");
    startTransition(async () => {
      const formData = new FormData();
      formData.set("username", username);
      formData.set("pin", pin);
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
        setPin("");
      }
    });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50 p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 flex flex-col gap-6">
        <div className="text-center">
          <div className="text-6xl mb-3">🧠</div>
          <h1 className="text-3xl font-bold text-amber-800">记忆训练</h1>
          <p className="text-gray-500 mt-1 text-lg">认知训练，每天一练</p>
        </div>

        <div>
          <label className="block text-xl font-semibold text-gray-700 mb-2">
            用户名
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入用户名"
            className="w-full border-2 border-amber-300 rounded-xl px-4 py-3 text-xl focus:outline-none focus:border-amber-500"
            autoComplete="username"
          />
        </div>

        <div>
          <label className="block text-xl font-semibold text-gray-700 mb-2">
            密码
          </label>
          <div className="flex justify-center gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-14 h-14 border-2 border-amber-300 rounded-xl flex items-center justify-center text-2xl font-bold bg-amber-50"
              >
                {pin[i] ? "●" : ""}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {PIN_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => handleKey(key)}
              className={`senior-btn ${
                key === "清除" || key === "删除"
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-amber-100 text-amber-900 hover:bg-amber-200"
              }`}
              style={{ fontSize: "1.5rem" }}
            >
              {key}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-center text-lg">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="senior-btn w-full bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {isPending ? "登录中..." : "登 录"}
        </button>
      </div>
    </div>
  );
}
