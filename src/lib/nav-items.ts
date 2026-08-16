import { Kanban, LayoutDashboard, LayoutList, Target, UserPlus, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

/** Compartilhado entre Sidebar (desktop) e MobileNav (menu sanduíche). */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/leads", label: "Leads", icon: LayoutList },
  { href: "/leads/novo", label: "Novo lead", icon: UserPlus },
  { href: "/metas", label: "Metas", icon: Target },
];
