import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import Link from "next/link";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "早上好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

function getTodayString() {
  return new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

export default async function SeniorHome() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "SENIOR") redirect("/dashboard");

  const greeting = getGreeting();
  const today = getTodayString();

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col">
      {/* Header */}
      <div className="bg-amber-500 text-white p-6 text-center shadow-md">
        <p className="text-xl opacity-90">{today}</p>
        <h1 className="text-4xl font-bold mt-1">
          {greeting}，{session.displayName}！
        </h1>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
        {/* Big start button */}
        <Link
          href="/session"
          className="senior-btn bg-green-500 text-white hover:bg-green-600 shadow-lg w-full max-w-sm text-3xl py-8 rounded-3xl flex flex-col gap-2"
          style={{ minHeight: "140px" }}
        >
          <span className="text-5xl">▶</span>
          <span>开始练习</span>
        </Link>

        {/* Info card */}
        <div className="bg-white rounded-3xl shadow p-6 w-full max-w-sm text-center">
          <p className="text-gray-500 text-xl">每次练习 5–15 分钟</p>
          <p className="text-gray-500 text-xl mt-1">做完后记得休息一下 😊</p>
        </div>
      </div>

      {/* Logout */}
      <div className="p-6 text-center">
        <form action={logout}>
          <button
            type="submit"
            className="text-gray-400 text-lg underline"
          >
            退出登录
          </button>
        </form>
      </div>
    </div>
  );
}
