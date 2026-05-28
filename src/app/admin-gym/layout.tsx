import { AdminGymSidebar } from "@/components/admin/AdminGymSidebar";
import { AdminGymHeader } from "@/components/admin/AdminGymHeader";

export default async function AdminGymLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors overflow-hidden">
      <AdminGymSidebar />

      <div className="flex-1 flex flex-col min-h-0">
        <main className="flex-1 overflow-y-auto p-4 pt-16 lg:p-6 lg:pt-6 xl:p-8 xl:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
