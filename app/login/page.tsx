import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const sp = await searchParams;
  const initialError = sp.error === "1";
  return <LoginForm initialError={initialError} />;
}
