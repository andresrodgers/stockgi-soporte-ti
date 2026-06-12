import { requirePageSession } from "@/server/navigation";

export default async function TiLayout({ children }: { children: React.ReactNode }) {
  await requirePageSession(["ti_operativo"]);

  return <>{children}</>;
}
