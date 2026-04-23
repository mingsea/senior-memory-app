"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  deleteSession,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/auth";

export async function login(formData: FormData) {
  const username = formData.get("username")?.toString().trim();
  const pin = formData.get("pin")?.toString().trim();

  if (!username || !pin) {
    return { error: "请输入用户名和密码" };
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return { error: "用户名或密码错误" };
  }

  const valid = await bcrypt.compare(pin, user.pin);
  if (!valid) {
    return { error: "用户名或密码错误" };
  }

  const token = await createSession(user.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

  if (user.role === "SENIOR") {
    redirect("/home");
  } else {
    redirect("/dashboard");
  }
}

export async function logout() {
  await deleteSession();
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
