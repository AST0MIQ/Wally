"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import type { ActionResult, FieldErrors } from "@/server/lib/action";
import { toast } from "@/components/ui/toaster";

type RunOptions = {
  successMessage?: string;
  onSuccess?: () => void;
  /** refresh the current route on success (default true) */
  refresh?: boolean;
};

/**
 * Client helper to invoke a Server Action that returns `ActionResult`.
 * Surfaces field errors, shows a toast on failure, and refreshes on success.
 */
export function useAction<TInput, TData>(
  fn: (input: TInput) => Promise<ActionResult<TData>>,
) {
  const router = useRouter();
  const t = useTranslations("errors");
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const run = useCallback(
    (input: TInput, options: RunOptions = {}) =>
      new Promise<ActionResult<TData>>((resolve) => {
        startTransition(async () => {
          const result = await fn(input);
          if (result.ok) {
            setFieldErrors({});
            if (options.successMessage) toast.success(options.successMessage);
            if (options.refresh !== false) router.refresh();
            options.onSuccess?.();
          } else {
            setFieldErrors(result.fieldErrors ?? {});
            const known: Record<string, string> = {
              validation_error: t("validation"),
              unexpected_error: t("generic"),
              rate_limited: t("rateLimited"),
              account_has_activity: t("accountActivity"),
              portfolio_has_transactions: t("portfolioActivity"),
              same_account: t("sameAccount"),
              oversell: t("oversell"),
              insufficient_balance: t("insufficientBalance"),
              to_amount_required: t("receivedAmount"),
              settlement_currency_mismatch: t("currencyMismatch"),
              account_not_found: t("selection"),
              category_not_found: t("selection"),
              subcategory_not_found: t("selection"),
              security_not_found: t("selection"),
              // cosmetics
              not_owned: t("notOwned"),
              collection_not_fully_owned: t("collectionNotFullyOwned"),
              collection_has_unpublished_assets: t("collectionUnpublished"),
              collection_not_published: t("collectionUnpublished"),
              collection_membership_frozen: t("membershipFrozen"),
              wrong_slot: t("wrongSlot"),
              asset_has_references: t("hasReferences"),
              collection_has_references: t("hasReferences"),
              published_asset_config_locked: t("configLocked"),
              slot_taken_in_collection: t("slotTaken"),
            };
            toast.error(known[result.error] ?? t("generic"));
          }
          resolve(result);
        });
      }),
    [fn, router, t],
  );

  return { run, pending, fieldErrors, clearErrors: () => setFieldErrors({}) };
}
