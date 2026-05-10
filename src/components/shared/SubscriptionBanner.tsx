"use client";

import { useSession } from "next-auth/react";
import { AlertTriangle, Lock } from "lucide-react";

export function SubscriptionBanner() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const status = session.user.subscriptionStatus;
  const endDate = session.user.subscriptionEndDate ? new Date(session.user.subscriptionEndDate) : null;
  const nowReference = new Date(session.user.serverNow);
  const isExpired = endDate && endDate < nowReference;
  const isInactive = status === "INACTIVE" || isExpired;

  if (!isInactive) return null;

  return (
    <div className="rounded-2xl border-2 border-dashed border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-8 text-center animate-in fade-in zoom-in duration-300">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 mb-4">
        <Lock className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        Cuota Caducada
      </h2>
      <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
        Tu suscripción ha finalizado o ha sido desactivada. Por favor, pasa por la recepción de tu centro deportivo para renovarla y seguir entrenando.
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-3xl font-bold text-sm shadow-soft shadow-red-500/20">
        Acceso Restringido
      </div>
    </div>
  );
}

export function useIsSubscriptionActive() {
  const { data: session } = useSession();
  if (!session?.user) return true; // Assume true while loading or not logged in to avoid flickering

  const status = session.user.subscriptionStatus;
  const endDate = session.user.subscriptionEndDate ? new Date(session.user.subscriptionEndDate) : null;
  const nowReference = new Date(session.user.serverNow);
  const isExpired = endDate && endDate < nowReference;
  const isInactive = status === "INACTIVE" || isExpired;

  return !isInactive;
}
