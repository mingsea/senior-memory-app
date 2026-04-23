import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { setExerciseEnabled } from "@/lib/actions/settings";

const EXERCISE_LABELS: Record<string, string> = {
  CARD_MEMORY: "记扑克牌",
  PATTERN_MEMORY: "图案记忆",
  OBJECT_MEMORY: "记物品名字",
  COMMON_SENSE: "常识问答",
};

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "CAREGIVER") redirect("/home");

  const supportedTypes = new Set(Object.keys(EXERCISE_LABELS));
  const configs = (await prisma.exerciseConfig.findMany({
    orderBy: { exerciseType: "asc" },
  })).filter((config) => supportedTypes.has(config.exerciseType));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-amber-500 text-white px-6 py-4 flex items-center gap-4 shadow-md">
        <Link href="/dashboard" className="text-white text-2xl">
          ←
        </Link>
        <h1 className="text-2xl font-bold">训练设置</h1>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            练习项目开关
          </h2>
          <p className="text-gray-500 mb-4">选择哪些练习在训练中出现</p>
          <div className="space-y-3">
            {configs.map((config) => (
              <form
                key={config.id}
                action={setExerciseEnabled}
                className="flex items-center justify-between gap-4 p-4 border border-gray-100 rounded-xl"
              >
                <input type="hidden" name="exerciseType" value={config.exerciseType} />
                <input type="hidden" name="enabled" value={String(!config.enabled)} />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 text-lg">
                    {EXERCISE_LABELS[config.exerciseType] || config.titleZh}
                  </p>
                  <p className="text-gray-500 text-sm">{config.descriptionZh}</p>
                </div>
                <button
                  type="submit"
                  className={`shrink-0 rounded-xl px-4 py-2 text-base font-semibold transition-colors ${
                    config.enabled
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {config.enabled ? "已开启" : "已关闭"}
                </button>
              </form>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
