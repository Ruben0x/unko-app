"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadPhoto } from "@/components/upload-photo";

type Field = {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  as?: "textarea" | "select";
  options?: { value: string; label: string }[];
};

const FIELDS: Field[] = [
  {
    id: "title",
    label: "Título",
    placeholder: "Ej: Restaurante El Pescador",
    required: true,
  },
  {
    id: "type",
    label: "Tipo",
    as: "select",
    required: true,
    options: [
      { value: "PLACE", label: "Lugar" },
      { value: "FOOD", label: "Comida" },
    ],
  },
  {
    id: "description",
    label: "Descripción",
    as: "textarea",
    placeholder: "Descripción breve (opcional)",
  },
  {
    id: "location",
    label: "Ubicación",
    placeholder: "Ej: Cartagena, Colombia (opcional)",
  },
  {
    id: "externalUrl",
    label: "Enlace externo",
    type: "url",
    placeholder: "https://... (opcional)",
  },
];

export function CreateItemForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  function openModal() {
    setError(null);
    setImageUrl(null);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setError(null);
    setImageUrl(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);

    const body: Record<string, string | undefined> = {
      title: (fd.get("title") as string).trim(),
      type: fd.get("type") as string,
    };

    const description = (fd.get("description") as string).trim();
    const location = (fd.get("location") as string).trim();
    const externalUrl = (fd.get("externalUrl") as string).trim();

    if (description) body.description = description;
    if (location) body.location = location;
    if (externalUrl) body.externalUrl = externalUrl;
    if (imageUrl) body.imageUrl = imageUrl;

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Error al crear el ítem");
        return;
      }

      closeModal();
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={openModal}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
      >
        + Nuevo ítem
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">
                Nuevo ítem
              </h2>
              <button
                onClick={closeModal}
                className="text-zinc-400 hover:text-zinc-600"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {FIELDS.map((field) => (
                <div key={field.id} className="flex flex-col gap-1">
                  <label
                    htmlFor={field.id}
                    className="text-xs font-medium text-zinc-700"
                  >
                    {field.label}
                    {field.required && (
                      <span className="ml-0.5 text-red-500">*</span>
                    )}
                  </label>

                  {field.as === "select" ? (
                    <select
                      id={field.id}
                      name={field.id}
                      required={field.required}
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                    >
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : field.as === "textarea" ? (
                    <textarea
                      id={field.id}
                      name={field.id}
                      rows={3}
                      placeholder={field.placeholder}
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none"
                    />
                  ) : (
                    <input
                      id={field.id}
                      name={field.id}
                      type={field.type ?? "text"}
                      required={field.required}
                      placeholder={field.placeholder}
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                    />
                  )}
                </div>
              ))}

              {/* Image upload — optional */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-zinc-700">
                  Imagen del ítem (opcional)
                </span>

                {imageUrl && (
                  <div className="relative w-full h-36 rounded-lg overflow-hidden border border-zinc-200">
                    <Image
                      src={imageUrl}
                      alt="Vista previa"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl(null)}
                      className="absolute top-1.5 right-1.5 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white hover:bg-black/70"
                    >
                      Eliminar
                    </button>
                  </div>
                )}

                <UploadPhoto
                  label={imageUrl ? "Cambiar imagen" : "Subir imagen"}
                  onUpload={(url) => setImageUrl(url)}
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
