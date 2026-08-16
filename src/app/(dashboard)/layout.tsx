import { getCurrentUsuario } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import type { Mercado } from "@/lib/types/database";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const usuario = await getCurrentUsuario();

  const supabase = await createClient();
  const { data: mercados } = await supabase.from("mercados").select("*").order("nome");

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar usuario={usuario} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar usuario={usuario} mercados={(mercados as Mercado[]) ?? []} />
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-background px-4 py-6 md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
