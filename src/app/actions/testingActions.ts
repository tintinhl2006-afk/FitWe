"use server";

import { cookies } from "next/headers";

export async function setMockDate(dateStr: string) {
  const cookieStore = await cookies();
  cookieStore.set("fitwe-mock-date", dateStr, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}

export async function clearMockDate() {
  const cookieStore = await cookies();
  cookieStore.delete("fitwe-mock-date");
}
