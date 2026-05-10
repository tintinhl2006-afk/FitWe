"use client";

import { useState } from "react";
import { X } from "lucide-react";

type ModalType = "aviso" | "privacidad" | "terminos" | null;

const legalContents: Record<string, { title: string; body: React.ReactNode }> = {
  aviso: {
    title: "Aviso Legal",
    body: (
      <div className="space-y-4">
        <p>En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa que la plataforma FitWe (en adelante, la Plataforma) es un software B2B2C diseñado para la gestión integral de centros deportivos.</p>
        <p>Contacto: Para cualquier consulta legal, técnica o comercial, puede dirigirse a nosotros a través del correo electrónico facilitado por la administración de la plataforma.</p>
        <p>Propiedad Intelectual: Todos los contenidos, diseño estructurado, logotipos y código fuente de esta aplicación están protegidos por la normativa de propiedad intelectual e industrial. Queda terminantemente prohibida su reproducción, modificación o distribución sin consentimiento expreso.</p>
      </div>
    ),
  },
  privacidad: {
    title: "Política de Privacidad (RGPD)",
    body: (
      <div className="space-y-4">
        <p>En FitWe estamos comprometidos con la protección de tus datos personales, cumpliendo con el Reglamento General de Protección de Datos (RGPD) de la UE.</p>
        <p>1. Responsabilidad de los Datos: En el modelo B2B2C, el Centro Deportivo actúa como Responsable del Tratamiento de los datos de sus clientes. FitWe actúa exclusivamente como Encargado del Tratamiento, proveyendo la infraestructura técnica.</p>
        <p>2. Datos Recopilados: Recopilamos datos de identificación (nombre, email) y datos biométricos/salud (peso, altura, rutinas, nutrición) estrictamente necesarios para la prestación del servicio.</p>
        <p>3. Finalidad: Tus datos se utilizan exclusivamente para calcular requerimientos nutricionales, mostrar progresos deportivos y gestionar reservas. No vendemos tus datos a terceros.</p>
        <p>4. Derechos del Usuario: Puedes ejercer en cualquier momento tus derechos de Acceso, Rectificación, Cancelación, Oposición y Portabilidad (Derechos ARCO) contactando directamente con la gerencia de tu centro deportivo.</p>
      </div>
    ),
  },
  terminos: {
    title: "Términos y Condiciones de Uso",
    body: (
      <div className="space-y-4">
        <p>Al utilizar FitWe, aceptas los siguientes términos de servicio:</p>
        <p>1. Uso B2B (Gimnasios): La suscripción otorga al centro deportivo una licencia de uso de la plataforma. El centro es responsable de la veracidad de las cuotas y horarios publicados.</p>
        <p>2. Uso B2C (Usuarios finales): La aplicación se proporciona como una herramienta de apoyo deportivo. Las recomendaciones nutricionales y de entrenamiento generadas por la plataforma son orientativas y no sustituyen el consejo de un profesional médico o nutricionista colegiado.</p>
        <p>3. Disponibilidad: Hacemos todo lo posible por garantizar un <em>Uptime</em> del 99%, pero la plataforma se ofrece &quot;tal cual&quot; y no nos hacemos responsables de interrupciones temporales por mantenimiento de los servidores en la nube.</p>
        <p>4. Cancelación: Los usuarios pueden darse de baja en cualquier momento solicitándolo a su centro deportivo.</p>
      </div>
    ),
  },
};

export function LegalFooter() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const activeContent = activeModal ? legalContents[activeModal] : null;

  return (
    <>
      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} <span translate="no" className="notranslate">FitWe</span>. Todos los derechos reservados.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <button
              onClick={() => setActiveModal("aviso")}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors bg-transparent border-none cursor-pointer"
            >
              Aviso Legal
            </button>
            <button
              onClick={() => setActiveModal("privacidad")}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors bg-transparent border-none cursor-pointer"
            >
              Política de Privacidad
            </button>
            <button
              onClick={() => setActiveModal("terminos")}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors bg-transparent border-none cursor-pointer"
            >
              Términos y Condiciones
            </button>
          </div>
        </div>
      </footer>

      {/* Modal Legal */}
      {activeContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
              {activeContent.title}
            </h3>
            <div className="prose prose-sm dark:prose-invert max-h-[60vh] overflow-y-auto pr-2 text-slate-600 dark:text-slate-300 leading-relaxed">
              {activeContent.body}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
