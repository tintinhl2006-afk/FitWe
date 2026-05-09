"use client";

import { use } from "react";
import { RoutineBuilder } from "@/components/routines/RoutineBuilder";

export default function NuevaRutinaClientePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);

  return (
    <RoutineBuilder
      clientId={clientId}
      backUrl={`/admin-gym/clientes/${clientId}`}
      backLabel="Volver al cliente"
      redirectAfterCreate={`/admin-gym/clientes/${clientId}`}
    />
  );
}
