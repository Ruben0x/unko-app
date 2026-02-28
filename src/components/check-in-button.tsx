"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadPhoto } from "@/components/upload-photo";
import type { CheckSummary } from "@/types/item";

interface CheckInButtonProps {
  itemId: string;
  myCheck: CheckSummary | null;
}

export function CheckInButton({ itemId, myCheck }: CheckInButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const alreadyChecked = myCheck !== null;

  async function submit(photoUrl?: string) {
    setSaving(true);

    try {
      const res = await fetch(`/api/items/${itemId}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(photoUrl ? { photoUrl } : {}),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        toast.error(data.error ?? "Error al registrar la visita");
        return;
      }

      setOpen(false);
      setPendingUrl(null);
      router.refresh();
      toast.success(alreadyChecked ? "Foto actualizada" : "Visita registrada");
    } catch {
      toast.error("Error de red. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Trigger */}
      <button
        onClick={() => {
          setOpen((v) => !v);
          setPendingUrl(null);
        }}
        className="text-xs font-medium text-green-700 underline underline-offset-2 hover:text-green-900 text-left dark:text-green-400 dark:hover:text-green-300"
      >
        {alreadyChecked ? "Actualizar foto" : "✓ Registrar visita"}
      </button>

      {/* Inline panel */}
      {open && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 flex flex-col gap-3 dark:border-zinc-700 dark:bg-zinc-800">
          {pendingUrl && (
            <Image
              src={pendingUrl}
              alt="Vista previa"
              width={80}
              height={80}
              className="rounded-lg object-cover border border-zinc-200 dark:border-zinc-600"
            />
          )}

          <UploadPhoto
            label={pendingUrl ? "Cambiar foto" : "Subir foto (opcional)"}
            onUpload={(url) => setPendingUrl(url)}
            disabled={saving}
          />

          <div className="flex gap-2">
            <button
              onClick={() => submit(pendingUrl ?? undefined)}
              disabled={saving}
              className="rounded-lg bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-800 disabled:opacity-50"
            >
              {saving ? "Guardando..." : alreadyChecked ? "Actualizar" : "Confirmar visita"}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setPendingUrl(null);
              }}
              disabled={saving}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-white disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
