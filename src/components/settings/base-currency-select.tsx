"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setBaseCurrency } from "@/app/actions/preferences";
import { COMMON_CURRENCIES } from "@/lib/currency";
import { Select } from "@/components/ui/select";

export function BaseCurrencySelect({ value }: { value: string }) {
  const router = useRouter();
  const [currency, setCurrency] = useState(value);
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={currency}
      disabled={pending}
      aria-label="Base currency"
      onChange={(event) => {
        const next = event.target.value;
        setCurrency(next);
        startTransition(async () => {
          await setBaseCurrency(next);
          router.refresh();
        });
      }}
    >
      {COMMON_CURRENCIES.map(({ code }) => (
        <option key={code} value={code}>{code}</option>
      ))}
    </Select>
  );
}
