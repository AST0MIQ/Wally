"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useAction } from "@/hooks/use-action";
import { duplicateAssetAction } from "@/app/actions/admin/cosmetics";
import { Button } from "@/components/ui/button";

export function DuplicateAssetButton({
  id,
  baseSlug,
}: {
  id: string;
  baseSlug: string;
}) {
  const tc = useTranslations("admin.common");
  const router = useRouter();
  const dup = useAction(duplicateAssetAction);

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={dup.pending}
      onClick={async () => {
        const slug = `${baseSlug}-copy-${Math.random().toString(36).slice(2, 6)}`;
        const res = await dup.run({ id, slug }, { successMessage: tc("createdToast") });
        if (res.ok && res.data)
          router.push(`/admin/appearance/assets/${res.data.id}`);
      }}
    >
      {tc("duplicate")}
    </Button>
  );
}
