import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: () => {} }) }));
vi.mock("@/hooks/use-action", () => ({
  useAction: () => ({ run: async () => ({ ok: true }), pending: false }),
}));
// don't pull the "use server" module graph (next-auth) into a node unit test
vi.mock("@/app/actions/admin/cosmetics", () => ({
  attachAssetAction: vi.fn(),
  detachAssetAction: vi.fn(),
}));

import { CollectionAssetsPanel } from "@/components/admin/collection-assets-panel";

const props = {
  collectionId: "c1",
  attached: [] as never[],
  candidates: [
    { id: "a1", name: "BG", slug: "bg", slot: "APP_BACKGROUND", status: "PUBLISHED" },
  ],
};

describe("[regression] CollectionAssetsPanel frozen state", () => {
  it("a fresh DRAFT collection (frozen=false) shows attach controls and no frozen message", () => {
    const html = renderToStaticMarkup(
      <CollectionAssetsPanel {...props} frozen={false} />,
    );
    expect(html).toContain("onePerSlot"); // the normal helper text
    expect(html).not.toContain("frozenHint");
    expect(html).toContain("<select"); // the attach picker
    expect(html).toContain("attach"); // the attach button label
    expect(html).toContain("pickAsset");
  });

  it("a published collection (frozen=true) shows the frozen message and no attach controls", () => {
    const html = renderToStaticMarkup(
      <CollectionAssetsPanel {...props} frozen />,
    );
    expect(html).toContain("frozenHint");
    expect(html).not.toContain("onePerSlot");
    expect(html).not.toContain("<select");
    expect(html).not.toContain("pickAsset");
  });

  it("defaults to NOT frozen when the prop is omitted", () => {
    const html = renderToStaticMarkup(<CollectionAssetsPanel {...props} />);
    expect(html).toContain("<select");
    expect(html).not.toContain("frozenHint");
  });
});
