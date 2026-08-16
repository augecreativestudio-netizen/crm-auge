import { getCurrentUsuario } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { NewLeadForm } from "./NewLeadForm";

export default async function NovoLeadPage({
  searchParams,
}: {
  searchParams: Promise<{ mercado?: string }>;
}) {
  const { mercado: mercadoCodigo } = await searchParams;
  const usuarioAtual = await getCurrentUsuario();
  const supabase = await createClient();

  const [{ data: mercados }, { data: usuarios }] = await Promise.all([
    supabase.from("mercados").select("*").order("nome"),
    supabase.from("usuarios").select("*").eq("ativo", true).order("nome"),
  ]);

  const mercadoPadraoId = mercadoCodigo
    ? (mercados ?? []).find((m) => m.codigo === mercadoCodigo)?.id
    : undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-auge-green">Novo lead</h1>
        <p className="text-sm text-auge-green/60">Cadastre um novo lead no funil comercial.</p>
      </div>
      <NewLeadForm
        mercados={mercados ?? []}
        usuarios={usuarios ?? []}
        usuarioAtual={usuarioAtual}
        mercadoPadraoId={mercadoPadraoId}
      />
    </div>
  );
}
