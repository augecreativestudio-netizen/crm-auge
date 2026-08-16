import Image from "next/image";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-auge-beige px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image src="/auge-logo.png" alt="Auge Creative Studio" width={96} height={96} priority />
          <div>
            <h1 className="font-display text-2xl text-auge-green">CRM Auge</h1>
            <p className="font-script text-lg text-auge-brown">creative studio</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-auge-green/60">
          Acesso restrito à equipe da Auge Creative Studio.
        </p>
      </div>
    </main>
  );
}
