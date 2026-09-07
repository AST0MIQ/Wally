"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { AccountLite } from "@/server/services/account.service";
import type { CategoryNode } from "@/server/services/category.service";
import { QuickAddSheet } from "@/components/transactions/quick-add-sheet";
import type { QuickAddMode } from "@/components/transactions/quick-add-sheet";

type QuickAddOptions = {
  mode?: QuickAddMode;
  fromAccountId?: string;
  toAccountId?: string;
};
type QuickAddContextValue = { open: (options?: QuickAddOptions) => void };

const QuickAddContext = createContext<QuickAddContextValue | null>(null);

export function useQuickAdd(): QuickAddContextValue {
  const ctx = useContext(QuickAddContext);
  if (!ctx) throw new Error("useQuickAdd must be used within QuickAddProvider");
  return ctx;
}

export function QuickAddProvider({
  accounts,
  categories,
  children,
}: {
  accounts: AccountLite[];
  categories: CategoryNode[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<QuickAddOptions>({});
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // open via ?new=1 (e.g. from the bottom-nav deep link / PWA shortcut)
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete("new");
      router.replace(`${pathname}${next.size ? `?${next}` : ""}`, {
        scroll: false,
      });
    }
  }, [searchParams, pathname, router]);

  const openSheet = useCallback((next: QuickAddOptions = {}) => {
    setOptions(next);
    setOpen(true);
  }, []);

  return (
    <QuickAddContext.Provider value={{ open: openSheet }}>
      {children}
      {(
        <QuickAddSheet
          open={open}
          onOpenChange={setOpen}
          accounts={accounts}
          categories={categories}
          defaultKind={options.mode}
          defaultFromAccountId={options.fromAccountId}
          defaultToAccountId={options.toAccountId}
        />
      )}
    </QuickAddContext.Provider>
  );
}
