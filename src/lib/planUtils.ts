export interface PlanGrantInput {
  billingType: "DURATION" | "CREDITS";
  durationDays: number;
  creditsPerCycle?: number | null;
  creditRechargeMode?: "PER_PAYMENT" | "PERIODIC" | null;
  rechargeIntervalDays?: number | null;
  creditsNeverExpire?: boolean;
}

export interface PlanGrantCurrentState {
  subscriptionEndDate: Date | null;
  subscriptionStatus: string;
  creditsRemaining: number | null;
}

export interface PlanGrantResult {
  subscriptionEndDate: Date | null;
  creditsRemaining: number | null;
  creditsNextRechargeAt: Date | null;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Computes what a payment/renewal should apply to a user's subscription state for a given
 * plan, without touching the database — the caller merges the result into whichever
 * `tx.user.update({ data: { subscriptionStatus: "ACTIVE", ...grant } })` it already runs.
 *
 * Pure so all payment-completion call sites (Stripe/Redsys verify, webhook, manual admin
 * renewal) share one source of truth instead of re-implementing the date/credit math.
 */
export function computePlanGrant(plan: PlanGrantInput, current: PlanGrantCurrentState): PlanGrantResult {
  const now = new Date();
  const stillActive =
    !!current.subscriptionEndDate && current.subscriptionEndDate > now && current.subscriptionStatus === "ACTIVE";
  const baseDate = stillActive ? current.subscriptionEndDate! : now;

  if (plan.billingType === "CREDITS") {
    if (plan.creditRechargeMode === "PERIODIC") {
      return {
        subscriptionEndDate: addDays(baseDate, plan.durationDays),
        creditsRemaining: plan.creditsPerCycle ?? 0,
        creditsNextRechargeAt: addDays(now, plan.rechargeIntervalDays ?? plan.durationDays),
      };
    }

    // PER_PAYMENT: top up the existing balance (reset to 0 first if it had already expired).
    // Credits that never expire have no `subscriptionEndDate` to judge "expired" against, so
    // they always carry forward — only the expiring case resets on a lapsed renewal.
    const creditsStillValid = plan.creditsNeverExpire || stillActive;
    return {
      subscriptionEndDate: plan.creditsNeverExpire ? null : addDays(baseDate, plan.durationDays),
      creditsRemaining: (creditsStillValid ? current.creditsRemaining || 0 : 0) + (plan.creditsPerCycle ?? 0),
      creditsNextRechargeAt: null,
    };
  }

  // DURATION: unchanged historical behaviour.
  return {
    subscriptionEndDate: addDays(baseDate, plan.durationDays),
    creditsRemaining: null,
    creditsNextRechargeAt: null,
  };
}
