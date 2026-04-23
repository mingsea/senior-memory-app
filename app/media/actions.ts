"use server";

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function uploadMedia(formData: FormData) {
  const user = await getSession();
  if (!user || user.role !== "CAREGIVER" || !user.seniorId) {
    return { error: "未授权" };
  }

  const file = formData.get("file");
  const caption = formData.get("caption")?.toString() || "";
  const peopleNames = formData.get("peopleNames")?.toString() || "";
  const year = formData.get("year")?.toString() || "";
  const location = formData.get("location")?.toString() || "";
  const activity = formData.get("activity")?.toString() || "";

  if (!(file instanceof File)) {
    return { error: "缺少必要信息" };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { error: "照片太大，请选择小于10MB的照片" };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "只支持 JPG、PNG、WEBP 格式" };
  }

  // Save to public/uploads
  const uploadDir = path.join(process.cwd(), "public", "uploads", user.seniorId);
  await mkdir(uploadDir, { recursive: true });

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${Date.now()}.${ext}`;
  const filepath = path.join(uploadDir, filename);
  const bytes = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(bytes));

  const url = `/uploads/${user.seniorId}/${filename}`;

  await prisma.mediaItem.create({
    data: {
      uploadedById: user.id,
      seniorId: user.seniorId,
      type: "PHOTO",
      url,
      caption: caption || null,
      peopleNames: peopleNames || null,
      year: year || null,
      location: location || null,
      activity: activity || null,
    },
  });

  revalidatePath("/media");
  return { success: true };
}

export async function updateMediaItem(
  id: string,
  data: {
    caption?: string;
    peopleNames?: string;
    year?: string;
    location?: string;
    activity?: string;
  }
) {
  const user = await getSession();
  if (!user || user.role !== "CAREGIVER" || !user.seniorId) {
    return { error: "未授权" };
  }

  const mediaItem = await prisma.mediaItem.findUnique({
    where: { id },
    select: { seniorId: true },
  });
  if (!mediaItem || mediaItem.seniorId !== user.seniorId) {
    return { error: "未授权" };
  }

  await prisma.mediaItem.update({
    where: { id },
    data: {
      caption: data.caption || null,
      peopleNames: data.peopleNames || null,
      year: data.year || null,
      location: data.location || null,
      activity: data.activity || null,
    },
  });

  revalidatePath("/media");
  return { success: true };
}

export async function deleteMediaItem(id: string) {
  const user = await getSession();
  if (!user || user.role !== "CAREGIVER" || !user.seniorId) {
    return { error: "未授权" };
  }

  const mediaItem = await prisma.mediaItem.findUnique({
    where: { id },
    select: { seniorId: true },
  });
  if (!mediaItem || mediaItem.seniorId !== user.seniorId) {
    return { error: "未授权" };
  }

  await prisma.mediaItem.delete({ where: { id } });
  revalidatePath("/media");
  return { success: true };
}
