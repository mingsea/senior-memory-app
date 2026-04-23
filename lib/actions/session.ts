"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { ExerciseType } from "@/lib/exercises/configs";

const ALL_EXERCISES: ExerciseType[] = [
  "CARD_MEMORY",
  "PATTERN_MEMORY",
  "OBJECT_MEMORY",
  "COMMON_SENSE",
];

function buildSessionExercises(enabled: Set<string>): ExerciseType[] {
  const available = ALL_EXERCISES.filter((t) => enabled.has(t));
  const pool: ExerciseType[] = available.length > 0 ? available : ALL_EXERCISES;

  // Shuffle category order, then repeat each category 3 times consecutively
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.flatMap((t) => [t, t, t]);
}

async function computeDifficulties(seniorId: string): Promise<Record<ExerciseType, number>> {
  const result = {} as Record<ExerciseType, number>;
  for (const type of ALL_EXERCISES) {
    const recent = await prisma.exerciseAttempt.findMany({
      where: {
        exerciseType: type,
        skipped: false,
        session: { seniorId },
      },
      orderBy: { startedAt: "desc" },
      take: 6,
      select: { scorePercent: true },
    });
    const allPerfect = (n: number) =>
      recent.length >= n && recent.slice(0, n).every((a) => (a.scorePercent ?? 0) === 100);
    result[type] = allPerfect(6) ? 3 : allPerfect(3) ? 2 : 1;
  }
  return result;
}

export async function startSession(manualDifficulty?: number): Promise<{
  sessionId: string;
  exercises: ExerciseType[];
  difficulties: Record<ExerciseType, number>;
}> {
  const user = await getSession();
  if (!user || user.role !== "SENIOR") throw new Error("未授权");

  const configs = await prisma.exerciseConfig.findMany({
    where: { enabled: true },
  });
  const enabledTypes = new Set(configs.map((c) => c.exerciseType));

  const exercises = buildSessionExercises(enabledTypes);
  const autoDifficulties = await computeDifficulties(user.id);

  const difficulties = manualDifficulty
    ? Object.fromEntries(ALL_EXERCISES.map((t) => [t, manualDifficulty])) as Record<ExerciseType, number>
    : autoDifficulties;

  const session = await prisma.trainingSession.create({
    data: {
      seniorId: user.id,
      durationGoalMins: 10,
    },
  });

  return { sessionId: session.id, exercises, difficulties };
}

export async function recordAttempt(data: {
  sessionId: string;
  exerciseType: ExerciseType;
  skipped: boolean;
  scorePercent?: number;
  responseData?: Record<string, unknown>;
}) {
  const user = await getSession();
  if (!user || user.role !== "SENIOR") throw new Error("未授权");

  const session = await prisma.trainingSession.findUnique({
    where: { id: data.sessionId },
    select: { seniorId: true, endedAt: true },
  });
  if (!session || session.seniorId !== user.id || session.endedAt) {
    throw new Error("训练不存在或已结束");
  }

  await prisma.exerciseAttempt.create({
    data: {
      sessionId: data.sessionId,
      exerciseType: data.exerciseType,
      skipped: data.skipped,
      scorePercent: data.scorePercent ?? null,
      responseData: JSON.stringify(data.responseData ?? {}),
      completedAt: new Date(),
    },
  });

  // Update completedExercises count
  await prisma.trainingSession.update({
    where: { id: data.sessionId },
    data: { completedExercises: { increment: data.skipped ? 0 : 1 } },
  });
}

export async function completeSession(sessionId: string, mood?: string) {
  const user = await getSession();
  if (!user || user.role !== "SENIOR") throw new Error("未授权");

  const session = await prisma.trainingSession.findUnique({
    where: { id: sessionId },
    select: { seniorId: true, endedAt: true },
  });
  if (!session || session.seniorId !== user.id || session.endedAt) {
    throw new Error("训练不存在或已结束");
  }

  await prisma.trainingSession.update({
    where: { id: sessionId },
    data: {
      endedAt: new Date(),
      mood: mood ?? null,
    },
  });

  revalidatePath("/dashboard");
}
