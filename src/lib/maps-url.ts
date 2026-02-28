export function getMapsUrl(location: string, placeId?: string | null): string {
  if (placeId) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}&query_place_id=${placeId}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}
