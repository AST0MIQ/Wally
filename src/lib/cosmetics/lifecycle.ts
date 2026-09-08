/**
 * `publishedAt` is the PERMANENT immutability marker for a cosmetic asset or
 * collection: once it has ever been PUBLISHED, its config / membership can
 * never change again — not even after the status is flipped back to DRAFT.
 *
 * Use loose `!= null` (not `!== null`): a genuinely-null column and a
 * value that a serialization / client boundary dropped to `undefined` must
 * BOTH read as "not yet published, still editable". Only a real timestamp
 * locks the record.
 */
export function wasEverPublished(x: {
  publishedAt?: Date | string | null;
}): boolean {
  return x.publishedAt != null;
}
