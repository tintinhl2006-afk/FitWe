"use client";

import { use } from "react";
import { RoutineBuilder } from "@/components/routines/RoutineBuilder";

export default function EditarRutinaClientePage({
  params,
}: {
  params: Promise<{ clientId: string; routineId: string }>;
}) {
  const { clientId, routineId } = use(params);

  return (
    <RoutineBuilder
      clientId={clientId}
      routineId={routineId}
      backUrl={`/admin-gym/clientes/${clientId}/rutinas`}
      backLabel="Volver a rutinas"
      redirectAfterCreate={`/admin-gym/clientes/${clientId}/rutinas`}
    />
  );
}
