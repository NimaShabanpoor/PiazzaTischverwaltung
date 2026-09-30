"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { loginAction, type LoginState } from "@/lib/actions/adminAuth";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";

const initialState: LoginState = {};

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-teal px-5">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-brown text-white">
            <Lock size={22} />
          </div>
          <h1 className="font-display text-2xl font-semibold text-brand-navy">
            Piazza 106 – Admin
          </h1>
          <p className="mt-1 text-sm text-brand-navy/60">
            Anmeldung für die Tischverwaltung
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="username">Benutzername</Label>
            <Input id="username" name="username" autoComplete="username" required />
          </div>
          <div>
            <Label htmlFor="password">Passwort</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {state.error && (
            <p className="rounded-xl bg-status-reserved-bg p-3 text-sm font-medium text-status-reserved">
              {state.error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={isPending}>
            {isPending ? "Anmelden…" : "Anmelden"}
          </Button>
        </form>
      </div>

      <Link
        href="/"
        className="mt-6 flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white"
      >
        <ArrowLeft size={16} />
        Zurück zur Startseite
      </Link>
    </div>
  );
}
