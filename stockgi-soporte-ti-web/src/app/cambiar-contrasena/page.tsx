import { requirePageSession } from "@/server/navigation";
import { ChangePasswordClient } from "./change-password-client";

export default async function ChangePasswordPage() {
  await requirePageSession(undefined, { allowPasswordChangeRequired: true });
  return <ChangePasswordClient />;
}
