"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "../prisma";
import { loginSchema } from "../validation";
import {
  ADMIN_COOKIE_MAX_AGE,
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
} from "../auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Bitte Benutzername und Passwort angeben." };
  }

  // Gross-/Kleinschreibung beim Benutzernamen ignorieren: Handy-Tastaturen
  // machen aus "chef" gerne automatisch "Chef".
  const user = await prisma.adminUser.findFirst({
    where: { username: { equals: parsed.data.username, mode: "insensitive" } },
  });

  // Bewusst dieselbe Fehlermeldung für "unbekannt" und "falsches Passwort",
  // um nicht zu verraten, ob ein Benutzername existiert.
  const invalid = { error: "Benutzername oder Passwort ist falsch." };
  if (!user) return invalid;

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return invalid;

  const token = await createAdminSessionToken({
    sub: user.id,
    username: user.username,
  });

  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });

  redirect("/admin");
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE_NAME);
  redirect("/admin/login");
}
