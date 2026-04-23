"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function setExerciseEnabled(formData: FormData) {
  const user = await getSession();
  if (!user || user.role !== "CAREGIVER") {
    throw new Error("未授权");
  }

  const exerciseType = formData.get("exerciseType")?.toString();
  const enabled = formData.get("enabled")?.toString() === "true";
  if (!exerciseType) {
    throw new Error("缺少练习类型");
  }

  await prisma.exerciseConfig.update({
    where: { exerciseType },
    data: { enabled },
  });

  revalidatePath("/settings");
}
