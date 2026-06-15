import { LoginClient } from "@/app/login-client";
import { redirectIfAuthenticated } from "@/server/navigation";

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return <LoginClient />;
}
