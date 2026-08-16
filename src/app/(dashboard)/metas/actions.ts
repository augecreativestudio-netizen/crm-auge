"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { getCurrentUsuario, requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { TipoMetaEnum } from "@/lib/types/database";

const MetaSchema = z.object({
  usuario_id: z.string().optional(), // vazio = meta agregada do time/mercado
  mercado_id: z.string().uuid("Selecione o mercado."),
  periodo: z.string().regex(/^\d{4}-\d{2}$/, "Período inválido."),
  tipo_meta: z.string(),
  valor_meta: z.coerce.number().positive("Informe um valor de meta maior que zero."),
});

export type MetaFormState = { error?: string } | undefined;

export async function createMeta(_prevState: MetaFormState, formData: FormData): Promise<MetaFormState> {
  const usuario = await getCurrentUsuario();
  requireAdmin(usuario);

  const parsed = MetaSchema.safeParse({
    usuario_id: formData.get("usuario_id") || undefined,
    mercado_id: formData.get("mercado_id"),
    periodo: formData.get("periodo"),
    tipo_meta: formData.get("tipo_meta"),
    valor_meta: formData.get("valor_meta"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("metas").insert({
    usuario_id: parsed.data.usuario_id || null,
    mercado_id: parsed.data.mercado_id,
    periodo: parsed.data.periodo,
    tipo_meta: parsed.data.tipo_meta as TipoMetaEnum,
    valor_meta: parsed.data.valor_meta,
  });

  if (error) return { error: error.message };

  revalidatePath("/metas");
}

export async function deleteMeta(metaId: string) {
  const usuario = await getCurrentUsuario();
  requireAdmin(usuario);

  const supabase = await createClient();
  const { error } = await supabase.from("metas").delete().eq("id", metaId);
  if (error) throw new Error(error.message);

  revalidatePath("/metas");
}
