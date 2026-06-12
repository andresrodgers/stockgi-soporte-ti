import { requirePageSession } from "@/server/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePageSession(["ti_administrativo"]);

  return <>{children}</>;
}
