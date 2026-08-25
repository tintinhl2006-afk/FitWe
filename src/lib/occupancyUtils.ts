import { prisma } from "@/lib/prisma";

/**
 * Cuenta clientes actualmente dentro del gimnasio a partir del AccessLog: para cada usuario se
 * mira su último registro concedido (GRANTED) en este gimnasio; si fue una entrada (ENTRY) y
 * ocurrió dentro de la ventana `autoExitMinutes`, se considera que sigue dentro.
 *
 * Este único mecanismo cubre ambos escenarios sin necesidad de un flag "tiene check-out" ni de
 * un cron de expiración: si el gimnasio escanea salidas, el EXIT explícito lo saca del recuento
 * al instante; si no, el temporizador actúa como salida automática.
 */
export async function getCurrentOccupancy(gymId: string, autoExitMinutes: number): Promise<number> {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint as count FROM (
      SELECT DISTINCT ON ("userId") "userId", "direction", "createdAt"
      FROM "AccessLog"
      WHERE "gymId" = ${gymId}::uuid AND "status" = 'GRANTED'
      ORDER BY "userId", "createdAt" DESC
    ) latest
    WHERE latest."direction" = 'ENTRY'
      AND latest."createdAt" >= NOW() - (INTERVAL '1 minute' * ${autoExitMinutes})
  `;
  return Number(rows[0]?.count ?? 0);
}
