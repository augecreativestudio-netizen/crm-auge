import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Usuario } from "@/lib/types/database";

/**
 * Data Access Layer — centraliza a checagem de sessão/autorização.
 * Ver node_modules/next/dist/docs/01-app/02-guides/authentication.md (seção "DAL").
 *
 * `getCurrentUsuario` valida a sessão com o Supabase Auth (getUser(), não apenas o
 * cookie) e redireciona para /login se não houver usuário autenticado ou se o
 * registro correspondente em `usuarios` ainda não existir.
 */
export const getCurrentUsuario = cache(async (): Promise<Usuario> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: usuario, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !usuario) {
    redirect("/login");
  }

  return usuario;
});

/** Mesma coisa, mas retorna `null` em vez de redirecionar — útil no proxy/topbar. */
export const getCurrentUsuarioOptional = cache(async (): Promise<Usuario | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", user.id)
    .single();

  return usuario ?? null;
});

export function requireAdmin(usuario: Usuario) {
  if (usuario.papel !== "admin") {
    throw new Error("Ação restrita a administradores.");
  }
}
