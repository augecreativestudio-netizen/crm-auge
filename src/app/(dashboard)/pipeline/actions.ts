"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUsuario } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { EstagioPipeline, MotivoPerdaEnum } from "@/lib/types/database";

/** Move um lead para qualquer estágio, exceto "Fechado (perdido)" — ver moveLeadToLost. */
export async function moveLeadStage(leadId: string, novoEstagio: EstagioPipeline) {
  await getCurrentUsuario();

  if (novoEstagio === "fechado_perdido") {
    throw new Error("Use moveLeadToLost para marcar um lead como perdido.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("leads_clientes")
    .update({ estagio_atual: novoEstagio })
    .eq("id", leadId);

  if (error) throw new Error(error.message);

  revalidatePath("/pipeline");
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
