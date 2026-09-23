import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad | FitWe",
  description: "Política de privacidad de FitWe, la app de gestión de gimnasios, entrenamiento y nutrición.",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="text-sm text-primary dark:text-cyan-400 hover:underline">
          ← Volver a FitWe
        </Link>

        <h1 className="mt-6 text-3xl font-black tracking-tight">Política de Privacidad</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="prose prose-slate dark:prose-invert mt-8 max-w-none space-y-6 leading-relaxed">
          <p>
            En FitWe (en adelante, &quot;la Plataforma&quot;) estamos comprometidos con la protección de tus datos
            personales, cumpliendo con el Reglamento General de Protección de Datos (RGPD) de la UE y la normativa
            española aplicable.
          </p>

          <section>
            <h2 className="text-xl font-bold mt-8 mb-2">1. Responsable y encargado del tratamiento</h2>
            <p>
              FitWe es un software B2B2C: el Centro Deportivo (gimnasio) al que estás vinculado actúa como
              <strong> Responsable del Tratamiento</strong> de tus datos como cliente. FitWe actúa exclusivamente
              como <strong>Encargado del Tratamiento</strong>, proporcionando la infraestructura técnica para la
              gestión de tu suscripción, entrenamientos, nutrición y acceso al centro.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-8 mb-2">2. Datos que recopilamos</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Datos de identificación: nombre, email, teléfono (si se facilita).</li>
              <li>Datos de salud y forma física: peso, altura, rutinas de entrenamiento, registros de sesiones, objetivos y registros nutricionales.</li>
              <li>Fotografía de perfil, si decides subir una (opcional, desde la cámara o la galería del dispositivo).</li>
              <li>Datos de pago y facturación necesarios para gestionar tu cuota (procesados por pasarelas de pago externas; FitWe no almacena datos completos de tarjetas).</li>
              <li>Datos técnicos básicos (dirección IP, tipo de dispositivo) con fines de seguridad, como la prevención de accesos fraudulentos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-8 mb-2">3. Finalidad del tratamiento</h2>
            <p>
              Tus datos se utilizan exclusivamente para: gestionar tu suscripción y acceso al centro deportivo,
              calcular requerimientos nutricionales, mostrar tu progreso deportivo, gestionar reservas de clases,
              generar el código QR de acceso, y enviarte comunicaciones operativas (confirmaciones, avisos de cuota,
              facturas). No vendemos tus datos a terceros ni los usamos con fines publicitarios ajenos al servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-8 mb-2">4. Con quién compartimos datos</h2>
            <p>
              Compartimos datos únicamente con proveedores estrictamente necesarios para prestar el servicio:
              alojamiento de base de datos, envío de emails transaccionales, almacenamiento de imágenes de perfil, y
              pasarelas de pago (Stripe o Redsys, según el método que tu centro tenga activo). Cada uno de estos
              proveedores procesa los datos exclusivamente para la finalidad encomendada.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-8 mb-2">5. Conservación de datos</h2>
            <p>
              Conservamos tus datos mientras mantengas una cuenta activa vinculada a tu centro deportivo, y durante
              el plazo adicional que exija la normativa fiscal o contable aplicable a las facturas emitidas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-8 mb-2">6. Tus derechos</h2>
            <p>
              Puedes ejercer en cualquier momento tus derechos de Acceso, Rectificación, Cancelación, Oposición y
              Portabilidad (derechos ARCO), así como solicitar la eliminación de tu cuenta, contactando directamente
              con la gerencia de tu centro deportivo o, alternativamente, desde la opción &quot;Eliminar mi cuenta
              permanentemente&quot; disponible en Configuración dentro de la propia aplicación.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-8 mb-2">7. Permisos del dispositivo móvil</h2>
            <p>
              La app móvil de FitWe puede solicitar acceso a la cámara y a la galería de fotos únicamente cuando
              decides cambiar tu foto de perfil de forma voluntaria. Estos permisos no se usan para ningún otro fin
              y puedes denegarlos sin que ello afecte al resto de funciones de la app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mt-8 mb-2">8. Contacto</h2>
            <p>
              Para cualquier consulta relacionada con la protección de tus datos, puedes escribir a{" "}
              <a href="mailto:tudesarrollodigital@gmail.com" className="text-primary dark:text-cyan-400 hover:underline">
                tudesarrollodigital@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
