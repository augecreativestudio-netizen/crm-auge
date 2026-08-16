"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { getCurrentUsuario } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { MotivoPerdaEnum, OrigemLead, PlataformaAds, TipoInteracao } from "@/lib/types/database";

const LeadSchema = z.object({
  nome: z.string().min(2, "Informe o nome do lead."),
  empresa: z.string().optional(),
  contato: z.string().optional(),
  mercado_id: z.string().uuid("Selecione o mercado."),
  origem: z.string(),
  responsavel_id: z.string().optional(),
  nome_campanha: z.string().optional(),
});

export type LeadFormState = { error?: string } | undefined;

export async function createLead(_prevState: LeadFormState, formData: FormData): Promise<LeadFormState> {
  const usuario = await getCurrentUsuario();

  const parsed = LeadSchema.safeParse({
    nome: formData.get("nome"),
    empresa: formData.get("empresa") || undefined,
    contato: formData.get("contato") || undefined,
    mercado_id: formData.get("mercado_id"),
    origem: formData.get("origem"),
    responsavel_id: formData.get("responsavel_id") || undefined,
    nome_campanha: formData.get("nome_campanha") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { nome, empresa, contato, mercado_id, origem, responsavel_id, nome_campanha } = parsed.data;
  const supabase = await createClient();

  let campanha_id: string | null = null;
  const isAdsOrigin = origem === "trafego_meta_ads" || origem === "trafego_google_ads";

  if (isAdsOrigin && nome_campanha) {
    const plataforma: PlataformaAds = origem === "trafego_meta_ads" ? "meta_ads" : "google_ads";
    const { data: campanha, error: campanhaError } = await supabase
      .from("campanhas_ads")
      .insert({ mercado_id, plataforma, nome: nome_campanha })
      .select("id")
      .single();

    if (campanhaError) return { error: campanhaError.message };
    campanha_id = campanha.id;
  }

  const { data: lead, error } = await supabase
    .from("leads_clientes")
    .insert({
      nome,
      empresa: empresa || null,
      contato: contato || null,
      mercado_id,
      origem: origem as OrigemLead,
      campanha_id,
      responsavel_id: responsavel_id || usuario.id,
      criado_por: usuario.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/pipeline");
  revalidatePath("/leads");
  redirect(`/leads/${lead.id}`);
}

export async function addInteracao(leadId: string, formData: FormData) {
  const usuario = await getCurrentUsuario();
  const supabase = await createClient();

  const tipo = formData.get("tipo") as TipoInteracao;
  const titulo = (formData.get("titulo") as string) || null;
  const transcricao = (formData.get("transcricao") as string) || null;

  const { error } = await supabase.from("interacoes").insert({
    lead_id: leadId,
    tipo,
    titulo,
    transcricao,
    usuario_id: usuario.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/leads/${leadId}`);
}

export async function addProposta(leadId: string, formData: FormData) {
  const usuario = await getCurrentUsuario();
  const supabase = await createClient();

  const link = (formData.get("link") as string) || null;
  const valorRaw = formData.get("valor") as string;
  const valor = valorRaw ? Number(valorRaw) : null;
  const moeda = (formData.get("moeda") as string) || null;
  const dataEnvio = (formData.get("data_envio") as string) || undefined;

  let arquivo_url: string | null = null;
  const arquivo = formData.get("arquivo") as File | null;
  if (arquivo && arquivo.size > 0) {
    const path = `${leadId}/${Date.now()}-${arquivo.name}`;
    const { error: uploadError } = await supabase.storage
      .from("propostas")
      .upload(path, arquivo);
    if (uploadError) throw new Error(uploadError.message);
    arquivo_url = path;
  }

  const { error } = await supabase.from("propostas").insert({
    lead_id: leadId,
    link,
    valor,
    moeda,
    arquivo_url,
    data_envio: dataEnvio,
    usuario_id: usuario.id,
  });

  if (error) throw new Error(error.message);

  // Enviar proposta normalmente também avança o estágio, se ainda não avançou.
  await supabase
    .from("leads_clientes")
    .update({ estagio_atual: "proposta_enviada" })
    .eq("id", leadId)
    .in("estagio_atual", ["novo_lead", "qualificacao", "reuniao_agendada"]);

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/pipeline");
}

export async function addFollowup(leadId: string, formData: FormData) {
  const usuario = await getCurrentUsuario();
  const supabase = await createClient();

  const titulo = formData.get("titulo") as string;
  const dataPrevista = formData.get("data_prevista") as string;

  const { error } = await supabase.from("followups").insert({
    lead_id: leadId,
    titulo,
    data_prevista: dataPrevista,
    responsavel_id: usuario.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/leads/${leadId}`);
}

export async function toggleFollowup(leadId: string, followupId: string, concluido: boolean) {
  await getCurrentUsuario();
  const supabase = await createClient();

  const { error } = await supabase
    .from("followups")
    .update({ concluido, concluido_em: concluido ? new Date().toISOString() : null })
    .eq("id", followupId);

  if (error) throw new Error(error.message);
  revalidatePath(`/leads/${leadId}`);
}

export async function setMotivoPerda(
  leadId: string,
  motivo: MotivoPerdaEnum,
  detalhe: string
) {
  const usuario = await getCurrentUsuario();
  const supabase = await createClient();

  await supabase.from("leads_clientes").update({ estagio_atual: "fechado_perdido" }).eq("id", leadId);

  const { error } = await supabase.from("motivos_perda").upsert(
    { lead_id: leadId, motivo_estruturado: motivo, detalhe_texto: detalhe || null, usuario_id: usuario.id },
    { onConflict: "lead_id" }
  );

  if (error) throw new Error(error.message);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/pipeline");
}
