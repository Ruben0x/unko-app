"use client";

import { useState } from "react";
import { GalleryLightbox, type GalleryPhoto } from "@/components/gallery-lightbox";

export function GalleryClient({ photos }: { photos: GalleryPhoto[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            onClick={() => setOpenIndex(i)}
            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-zinc-200 ring-0 transition-all hover:ring-2 hover:ring-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:hover:ring-zinc-500 sm:h-24 sm:w-24"
            aria-label={`Ver foto de ${photo.itemTitle}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={`${photo.itemTitle} — ${photo.userName ?? "visita"}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            {photo.userName && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5 text-center">
                <span className="truncate text-[9px] font-medium text-white">
                  {photo.userName}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <GalleryLightbox
          photos={photos}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onPrev={() => setOpenIndex((i) => (i !== null && i > 0 ? i - 1 : i))}
          onNext={() => setOpenIndex((i) => (i !== null && i < photos.length - 1 ? i + 1 : i))}
        />
      )}
    </>
  );
}
