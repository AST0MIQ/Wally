import { redirect } from "next/navigation";

import { requireCapability } from "@/server/lib/guards";

export default async function AccessControlIndex() {
  await requireCapability("roles:read");
  redirect("/admin/access/users");
}
