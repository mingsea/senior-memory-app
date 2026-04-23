import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import MediaUploader from "./MediaUploader";
import PhotoCard from "./PhotoCard";

export default async function MediaPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "CAREGIVER") redirect("/home");

  const seniorId = session.seniorId;
  const mediaItems = seniorId
    ? await prisma.mediaItem.findMany({
        where: { seniorId },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-amber-500 text-white px-6 py-4 flex items-center gap-4 shadow-md">
        <Link href="/dashboard" className="text-white text-2xl">
          ←
        </Link>
        <h1 className="text-2xl font-bold">家人照片管理</h1>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {seniorId ? (
          <>
            <MediaUploader seniorId={seniorId} uploadedById={session.id} />

            {mediaItems.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  已上传的照片 ({mediaItems.length})
                </h2>
                <div className="space-y-4">
                  {mediaItems.map((item) => (
                    <PhotoCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {mediaItems.length === 0 && (
              <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
                <p className="text-4xl mb-3">🖼️</p>
                <p className="text-lg">还没有照片，上传第一张吧！</p>
                <p className="text-sm mt-2">标注清楚信息后，练习时会问老人照片里的故事</p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-500">
            尚未关联训练账号，无法上传照片
          </div>
        )}
      </div>
    </div>
  );
}
