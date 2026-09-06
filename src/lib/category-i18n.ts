/**
 * Resolve a category / subcategory display name.
 *
 * Seeded defaults carry a `systemKey` and are translated via the `categories.*`
 * message namespace so the label follows the UI language. User-created rows
 * (systemKey === null) always show their stored `name` verbatim.
 *
 * Pass a translator scoped to `"categories"` (e.g. `useTranslations("categories")`
 * or `await getTranslations("categories")`).
 */
type CategoriesTranslator = ((key: string) => string) & {
  has: (key: string) => boolean;
};

export function categoryLabel(
  t: CategoriesTranslator,
  item: { systemKey: string | null; name: string },
): string {
  if (item.systemKey && t.has(item.systemKey)) return t(item.systemKey);
  return item.name;
}
