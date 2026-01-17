import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sardoba Admin | Вход",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-border/70 bg-white p-8 shadow-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Портал персонала</p>
          <h1 className="text-2xl font-semibold">Войдите, чтобы продолжить</h1>
          <p className="text-sm text-muted-foreground">Используйте учетные данные менеджера или официанта</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
