import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sardoba Admin | Login",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-border/70 bg-white p-8 shadow-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Staff Portal</p>
          <h1 className="text-2xl font-semibold">Sign in to continue</h1>
          <p className="text-sm text-muted-foreground">Use your manager or waiter credentials</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
