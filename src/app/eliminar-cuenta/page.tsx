import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eliminar cuenta | FitWe",
  description: "Cómo solicitar la eliminación de tu cuenta y tus datos en FitWe.",
};

export default function EliminarCuentaPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="text-sm text-primary dark:text-cyan-400 hover:underline">
          ← Volver a FitWe
        </Link>

        <h1 className="mt-6 text-3xl font-black tracking-tight">Eliminar tu cuenta</h1>

        <div className="prose prose-slate dark:prose-invert mt-8 max-w-none space-y-6 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mt-8 mb-2">Opción 1: desde la app o la web (inmediato)</h2>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Inicia sesión en la app móvil o en la web de FitWe.</li>
              <li>Ve a <strong>Configuración → Cuenta</strong>.</li>
              <li>Pulsa <strong>&quot;Eliminar mi cuenta permanentemente&quot;</strong> y confirma.</li>
            </ol>
            <p>La eliminación es inmediata e irreversible.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-8 mb-2">Opción 2: por email (si no puedes acceder a tu cuenta)</h2>
            <p>
              Escribe a{" "}
              <a href="mailto:tudesarrollodigital@gmail.com?subject=Solicitud%20de%20eliminaci%C3%B3n%20de%20cuenta" className="text-primary dark:text-cyan-400 hover:underline">
                tudesarrollodigital@gmail.com
              </a>{" "}
              desde el email asociado a tu cuenta, indicando &quot;Solicitud de eliminación de cuenta&quot;.
              Procesaremos la solicitud en un plazo máximo de 30 días.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-8 mb-2">Qué se elimina</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Tu perfil (nombre, email, foto, peso, altura).</li>
              <li>Tu historial de entrenamientos, rutinas y registros de nutrición.</li>
              <li>Tu vínculo con el centro deportivo.</li>
            </ul>
            <p className="mt-3">
              Las facturas ya emitidas se conservan de forma independiente durante el plazo que exige la normativa
              fiscal española, tal como se explica en nuestra{" "}
              <Link href="/privacidad" className="text-primary dark:text-cyan-400 hover:underline">
                Política de Privacidad
              </Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
