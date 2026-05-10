import { cookies } from "next/headers";
import { AdminGymSidebar } from "@/components/admin/AdminGymSidebar";
import { AdminGymHeader } from "@/components/admin/AdminGymHeader";
import { AlertTriangle } from "lucide-react";

export default async function AdminGymLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isMocked = cookieStore.get("fitwe-mock-date");

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors overflow-hidden">
      <AdminGymSidebar />

      <div className="flex-1 flex flex-col min-h-0">
        {isMocked && (
          <header className="sticky top-0 z-20 bg-indigo-600 text-white px-4 py-1.5 text-center text-[11px] font-bold flex items-center justify-center gap-2 shadow-inner">
            <AlertTriangle className="h-3 w-3" />
            TIEMPO SIMULADO: {new Date(isMocked.value).toLocaleString('es-ES')}
          </header>
        )}

        <main className="flex-1 overflow-y-auto p-4 pt-16 lg:p-6 lg:pt-6 xl:p-8 xl:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
