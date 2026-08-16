"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUsuario } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { EstagioPipeline, MotivoPerdaEnum } from "@/lib/types/database";

/** Move um lead para qualquer estágio, exceto "Fechado (perdido)" — ver moveLeadToLost. */
export async function moveLeadStage(leadId: string, novoEstagio: EstagioPipeline) {
  const usuario = await getCurrentUsuario();

  if (novoEstagio === "fechado_perdido") {
    throw new Error("Use moveLeadToLost para marcar um lead como perdido.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("leads_clientes")
    .update({ estagio_atual: novoEstagio })
    .eq("id", leadId);

  if (error) throw new Error(error.message);

  // Ao entrar em "Reunião agendada", cria automaticamente a tarefa
  // "Elaborar proposta" (se ainda não existir uma em aberto pra esse lead) —
  // pedido do usuário, pra não esquecer de preparar a proposta pós-reunião.
  if (novoEstagio === "reuniao_agendada") {
    const { data: existente } = await supabase
      .from("followups")
      .select("id")
      .eq("lead_id", leadId)
      .eq("titulo", "Elaborar proposta")
      .eq("tipo", "tarefa")
      .eq("concluido", false)
      .maybeSingle();

    if (!existente) {
      const prazo = new Date();
      prazo.setDate(prazo.getDate() + 2);

      await supabase.from("followups").insert({
        lead_id: leadId,
        tipo: "tarefa",
        titulo: "Elaborar proposta",
        data_prevista: prazo.toISOString().slice(0, 10),
        responsavel_id: usuario.id,
      });
    }
  }

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  revalidatePath(`/leads/${leadId}`);
}

/**
 * Marca o lead como "Fechado (perdido)" e grava o motivo estruturado (seção 4.4
 * do briefing exige isso sempre que o negócio é perdido).
 */
export async function moveLeadToLost(
  leadId: string,
  motivo: MotivoPerdaEnum,
  detalhe: string
) {
  const usuario = await getCurrentUsuario();
  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from("leads_clientes")
    .update({ estagio_atual: "fechado_perdido" })
    .eq("id", leadId);

  if (updateError) throw new Error(updateError.message);

  const { error: motivoError } = await supabase.from("motivos_perda").upsert(
    {
      lead_id: leadId,
      motivo_estruturado: motivo,
      detalhe_texto: detalhe || null,
      usuario_id: usuario.id,
    },
    { onConflict: "lead_id" }
  );

  if (motivoError) throw new Error(motivoError.message);

  revalidatePath("/pipeline");
  revalidatePath(`/leads/${leadId}`);
}
