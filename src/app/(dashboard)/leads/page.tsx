import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { estagioLabel, origemLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ mercado?: string }>;
}) {
  const { mercado: mercadoCodigo } = await searchParams;
  const supabase = await createClient();

  const { data: mercados } = await supabase.from("mercados").select("*");
  const mercadoMap = new Map((mercados ?? []).map((m) => [m.id, m]));

  let query = supabase.from("leads_clientes").select("*").order("criado_em", { ascending: false });

  if (mercadoCodigo) {
    const mercado = (mercados ?? []).find((m) => m.codigo === mercadoCodigo);
    if (mercado) query = query.eq("mercado_id", mercado.id);
  }

  const { data: leads } = await query;
  const { data: usuarios } = await supabase.from("usuarios").select("id, nome");
  const usuarioMap = new Map((usuarios ?? []).map((u) => [u.id, u.nome]));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-auge-green">Leads</h1>
          <p className="text-sm text-auge-green/60">{leads?.length ?? 0} lead(s)</p>
        </div>
        <Link
          href="/leads/novo"
          className="rounded-lg bg-auge-brown px-4 py-2 text-sm font-semibold text-white transition hover:bg-auge-brown-light"
        >
          + Novo lead
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-auge-beige-dark/40 text-xs uppercase tracking-wide text-auge-green/60">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Mercado</th>
              <th className="px-4 py-3">Origem</th>
              <th className="px-4 py-3">Estágio</th>
              <th className="px-4 py-3">Responsável</th>
            </tr>
          </thead>
          <tbody>
            {(leads ?? []).map((lead) => (
              <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-auge-beige/50">
                <td className="px-4 py-3">
                  <Link href={`/leads/${lead.id}`} className="font-medium text-auge-green hover:underline">
                    {lead.nome}
                  </Link>
                </td>
                <td className="px-4 py-3 text-auge-green/70">{lead.empresa ?? "—"}</td>
                <td className="px-4 py-3 text-auge-green/70">
                  {mercadoMap.get(lead.mercado_id)?.nome ?? "—"}
                </td>
                <td className="px-4 py-3 text-auge-green/70">{origemLabel(lead.origem)}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      lead.estagio_atual === "fechado_ganho" && "bg-emerald-100 text-emerald-700",
                      lead.estagio_atual === "fechado_perdido" && "bg-red-100 text-red-700",
                      lead.estagio_atual !== "fechado_ganho" &&
                        lead.estagio_atual !== "fechado_perdido" &&
                        "bg-auge-beige-dark text-auge-green"
                    )}
                  >
                    {estagioLabel(lead.estagio_atual)}
                  </span>
                </td>
                <td className="px-4 py-3 text-auge-green/70">
                  {lead.responsavel_id ? usuarioMap.get(lead.responsavel_id) ?? "—" : "—"}
                </td>
              </tr>
            ))}
            {(leads ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-auge-green/40">
                  Nenhum lead cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
