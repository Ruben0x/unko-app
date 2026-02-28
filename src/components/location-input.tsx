"use client";

import { useRef, useState, useEffect, useId } from "react";
import { getGoogleMapsLoader } from "@/lib/google-maps";

export function LocationInput({
  name,
  namePlaceId,
  defaultValue = "",
  defaultPlaceId = "",
  onChange,
  placeholder = "Buscar ubicación...",
  id,
}: {
  name: string;
  namePlaceId: string;
  defaultValue?: string;
  defaultPlaceId?: string;
  onChange?: (text: string, placeId: string | null) => void;
  placeholder?: string;
  id?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [displayValue, setDisplayValue] = useState(defaultValue);
  const [placeId, setPlaceId] = useState(defaultPlaceId);
  const [mapsReady, setMapsReady] = useState(false);

  const internalId = useId();
  const resolvedId = id ?? internalId;

  useEffect(() => {
    const loader = getGoogleMapsLoader();
    if (!loader || !inputRef.current) return;

    loader.load().then(() => {
      if (!inputRef.current) return;

      const ac = new google.maps.places.Autocomplete(inputRef.current, {
        fields: ["place_id", "formatted_address", "name"],
      });

      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        const text = place.formatted_address ?? place.name ?? inputRef.current?.value ?? "";
        const pid = place.place_id ?? null;
        setDisplayValue(text);
        setPlaceId(pid ?? "");
        onChange?.(text, pid);
      });

      autocompleteRef.current = ac;
      setMapsReady(true);
    }).catch(() => {
      // SDK failed to load (bad key, network issue) — degrade to plain text input
      setMapsReady(false);
    });

    return () => {
      autocompleteRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleClear() {
    setDisplayValue("");
    setPlaceId("");
    onChange?.("", null);
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
  }

  const noApiKey = !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <div className="relative">
      {/* Hidden inputs carry confirmed values into FormData */}
      <input type="hidden" name={name} value={displayValue} />
      <input type="hidden" name={namePlaceId} value={placeId} />

      {/* Pin icon */}
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 dark:text-zinc-500">
        📍
      </span>

      {/* Visible input — Google attaches its dropdown here */}
      <input
        ref={inputRef}
        id={resolvedId}
        type="text"
        defaultValue={defaultValue}
        placeholder={noApiKey ? placeholder : (mapsReady ? placeholder : "Cargando Maps...")}
        onChange={(e) => {
          setDisplayValue(e.target.value);
          // User typed manually → clear stale placeId
          if (placeId) setPlaceId("");
        }}
        className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-8 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:ring-zinc-500"
      />

      {/* Clear button */}
      {displayValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
          aria-label="Limpiar ubicación"
        >
          ✕
        </button>
      )}
    </div>
  );
}
