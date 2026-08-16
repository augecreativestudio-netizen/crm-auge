"use client";

import { useRef, useTransition } from "react";

export function FollowupForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          await action(formData);
          formRef.current?.reset();
        })
      }
      className="flex gap-2"
    >
      <input
        name="titulo"
        required
        placeholder="Ex: ligar de volta"
        className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm text-auge-green outline-none focus:border-auge-brown focus:ring-2 focus:ring-auge-brown/20"
      />
      <input
        name="data_prevista"
        type="date"
        required
        className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-auge-green outline-none focus:border-auge-brown focus:ring-2 focus:ring-auge-brown/20"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-auge-brown px-4 py-2 text-sm font-semibold text-white transition hover:bg-auge-brown-light disabled:opacity-60"
      >
        +
      </button>
    </form>
  );
}
