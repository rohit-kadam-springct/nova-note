export const FREE_LIMITS = { collections: 2, text: 2, link: 2, pdf: 1 };

export function canAdd(itemType: 'text'|'link'|'pdf', counts: Record<string, number>, isPro: boolean) {
  if (isPro) return true;
  return counts[itemType] < FREE_LIMITS[itemType];
}