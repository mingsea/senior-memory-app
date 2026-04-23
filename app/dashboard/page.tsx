import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CaregiverDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "CAREGIVER") redirect("/home");

  const seniorId = session.seniorId;

  // Fetch recent sessions and senior info
  const [senior, recentSessions] = await Promise.all([
    seniorId ? prisma.user.findUnique({ where: { id: seniorId } }) : null,
    seniorId
      ? prisma.trainingSession.findMany({
          where: { seniorId },
          orderBy: { startedAt: "desc" },
          take: 5,
          include: { attempts: true },
        })
      : [],
  ]);

  const totalSessions = seniorId
    ? await prisma.trainingSession.count({ where: { seniorId } })
    : 0;

  const moodEmoji: Record<string, string> = {
    HAPPY: "😊",
    OK: "😐",
    SAD: "😔",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-amber-500 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-2xl font-bold">管理后台</h1>
          <p className="text-amber-100 text-sm">
            欢迎，{session.displayName}
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="text-white underline text-sm">
            退出
          </button>
        </form>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Senior info */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3">
            👤 训练账号
          </h2>
          {senior ? (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-3xl">
                🧓
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {senior.displayName}
                </p>
                <p className="text-gray-500">账号：{senior.username}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">尚未关联训练账号</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow p-5 text-center">
            <p className="text-4xl font-bold text-amber-600">{totalSessions}</p>
            <p className="text-gray-600 mt-1">累计训练次数</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-5 text-center">
            <p className="text-4xl font-bold text-green-600">
              {recentSessions.filter((s) => s.endedAt).length}
            </p>
            <p className="text-gray-600 mt-1">最近5次完成</p>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/media"
            className="bg-blue-500 text-white rounded-2xl p-5 text-center hover:bg-blue-600 transition-colors"
          >
            <div className="text-3xl mb-2">📷</div>
            <p className="font-semibold text-lg">上传照片</p>
            <p className="text-blue-100 text-sm mt-1">管理家人照片</p>
          </Link>
          <Link
            href="/settings"
            className="bg-purple-500 text-white rounded-2xl p-5 text-center hover:bg-purple-600 transition-colors"
          >
            <div className="text-3xl mb-2">⚙️</div>
            <p className="font-semibold text-lg">训练设置</p>
            <p className="text-purple-100 text-sm mt-1">调整练习选项</p>
          </Link>
        </div>

        {/* Recent sessions */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📋 最近训练记录
          </h2>
          {recentSessions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">暂无训练记录</p>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between border border-gray-100 rounded-xl p-4"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {new Date(s.startedAt).toLocaleDateString("zh-CN", {
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                      })}
                    </p>
                    <p className="text-gray-500 text-sm">
                      完成 {s.completedExercises} 个练习
                    </p>
                  </div>
                  <div className="text-center">
                    <span className="text-3xl">
                      {s.mood ? moodEmoji[s.mood] : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
