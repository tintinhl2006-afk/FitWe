import crypto from "crypto";
import { getAuthSecret } from "@/lib/authSecret";

/**
 * Binds the data carried through a Redsys payment (Ds_Merchant_MerchantData) to this server.
 *
 * The webhook used to trust userId, planId, gymId and paymentMethodId from that field and then
 * verified the signature with the key of whichever payment method the field named. Anyone
 * holding any gym's Redsys key (an operator, or anyone using the public test merchant) could
 * therefore forge a callback granting a subscription to an arbitrary user. With this MAC, issued
 * only by the checkout endpoint, those fields can no longer be chosen by the caller.
 */
function bindingKey(): Buffer {
  return crypto.createHmac("sha256", getAuthSecret()).update("fitwe-payment-binding-v1").digest();
}

export interface PaymentBinding {
  userId: string;
  planId: string;
  gymId: string;
  paymentMethodId: string;
  order: string;
}

function message(b: PaymentBinding): string {
  return [b.userId, b.planId, b.gymId, b.paymentMethodId, b.order].join("|");
}

export function signPaymentBinding(b: PaymentBinding): string {
  return crypto.createHmac("sha256", bindingKey()).update(message(b)).digest("hex");
}

export function verifyPaymentBinding(b: PaymentBinding, mac: unknown): boolean {
  if (typeof mac !== "string" || !/^[0-9a-f]{64}$/.test(mac)) return false;
  const expected = Buffer.from(signPaymentBinding(b), "hex");
  const presented = Buffer.from(mac, "hex");
  return expected.length === presented.length && crypto.timingSafeEqual(expected, presented);
}
