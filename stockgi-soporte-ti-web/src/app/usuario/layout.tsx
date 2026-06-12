import { requirePageSession } from "@/server/navigation";

export default async function UsuarioLayout({ children }: { children: React.ReactNode }) {
  await requirePageSession(["usuario"]);

  return <>{children}</>;
}
