import { requirePageSession } from "@/server/navigation";

export default async function TicketsLayout({ children }: { children: React.ReactNode }) {
  await requirePageSession();

  return <>{children}</>;
}
