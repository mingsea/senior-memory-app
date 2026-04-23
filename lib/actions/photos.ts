"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export interface PhotoItem {
  id: string;
  url: string;
  caption: string | null;
  peopleNames: string | null;
  year: string | null;
  location: string | null;
  activity: string | null;
}

export async function getPhotosForExercise(): Promise<PhotoItem[]> {
  const user = await getSession();
  if (!user || user.role !== "SENIOR") return [];

  const photos = await prisma.mediaItem.findMany({
    where: {
      seniorId: user.id,
      type: "PHOTO",
    },
    select: {
      id: true,
      url: true,
      caption: true,
      peopleNames: true,
      year: true,
      location: true,
      activity: true,
    },
  });

  // Only return photos that have at least one piece of metadata to ask about
  return photos.filter(
    (p) => p.peopleNames || p.year || p.location || p.activity || p.caption
  );
}
