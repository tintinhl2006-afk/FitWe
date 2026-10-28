// node-redsys-api ships no type declarations. Only the two methods the checkout endpoint calls are
// declared; this replaces the `// @ts-ignore` comments that used to hide the whole module's types.
declare module "node-redsys-api" {
  export class Redsys {
    createMerchantParameters(params: Record<string, unknown>): string;
    createMerchantSignature(merchantKey: string, params: Record<string, unknown>): string;
  }
}
