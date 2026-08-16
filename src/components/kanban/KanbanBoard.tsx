"use client";

import { useMemo, useState, useTransition } from "react";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { ESTAGIOS_KANBAN } from "@/lib/constants";
import { moveLeadStage, moveLeadToLost } from "@/app/(dashboard)/pipeline/actions";
import { KanbanColumn } from "./KanbanColumn";
import { LeadCard, type LeadComRelacoes } from "./LeadCard";
import { LossReasonModal } from "./LossReasonModal";
import type { EstagioPipeline, MotivoPerdaEnum } from "@/lib/types/database";

export function KanbanBoard({ leads }: { leads: LeadComRelacoes[] }) {
  const [items, setItems] = useState(leads);
  const [activeLead, setActiveLead] = useState<LeadComRelacoes | null>(null);
  const [pendingLoss, setPendingLoss] = useState<LeadComRelacoes | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const columns = useMemo(() => {
    const grouped = new Map<EstagioPipeline, LeadComRelacoes[]>();
    for (const estagio of ESTAGIOS_KANBAN) grouped.set(estagio.value, []);
    for (const lead of items) {
      grouped.get(lead.estagio_atual)?.push(lead);
    }
    return grouped;
  }, [items]);

  function handleDragStart(event: DragStartEvent) {
    const lead = event.active.data.current?.lead as LeadComRelacoes | undefined;
    setActiveLead(lead ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const novoEstagio = over.id as EstagioPipeline;
    const lead = items.find((l) => l.id === leadId);
    if (!lead || lead.estagio_atual === novoEstagio) return;

    if (novoEstagio === "fechado_perdido") {
      setPendingLoss(lead);
      return;
    }

    const anterior = lead.estagio_atual;
    setItems((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, estagio_atual: novoEstagio } : l))
    );

    startTransition(async () => {
      try {
        await moveLeadStage(leadId, novoEstagio);
      } catch {
        setItems((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, estagio_atual: anterior } : l))
        );
      }
    });
  }

  async function confirmLoss(motivo: MotivoPerdaEnum, detalhe: string) {
    if (!pendingLoss) return;
    const lead = pendingLoss;
    setItems((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, estagio_atual: "fechado_perdido" } : l))
    );
    setPendingLoss(null);

    try {
      await moveLeadToLost(lead.id, motivo, detalhe);
    } catch {
      setItems((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, estagio_atual: lead.estagio_atual } : l))
      );
    }
  }

  return (
    <>
      <DndContext
        id="kanban-board"
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ESTAGIOS_KANBAN.map((estagio) => (
            <KanbanColumn
              key={estagio.value}
              estagio={estagio.value}
              label={estagio.label}
              leads={columns.get(estagio.value) ?? []}
            />
          ))}
        </div>
        <DragOverlay>{activeLead ? <LeadCard lead={activeLead} /> : null}</DragOverlay>
      </DndContext>

      {pendingLoss && (
        <LossReasonModal
          leadNome={pendingLoss.nome}
          onCancel={() => setPendingLoss(null)}
          onConfirm={confirmLoss}
        />
      )}
    </>
  );
}
