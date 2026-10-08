import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { Radar } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function LoginGate({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "SIGNED_OUT") qc.clear();
      if (event === "SIGNED_IN") qc.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [qc]);

  if (session === undefined) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando…</div>;
  if (!session) return <LoginForm />;
  return <>{children}</>;
}

function LoginForm() {
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) toast.error("E-mail ou senha incorretos.");
    } else {
      const { error } = await supabase.auth.signUp({ email, password: senha, options: { emailRedirectTo: window.location.origin } });
      if (error) toast.error(error.message);
      else { toast.success("Conta criada! Confirme pelo link enviado ao seu e-mail."); setModo("entrar"); }
    }
    setBusy(false);
  }

  const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-lg bg-card p-8 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground"><Radar className="h-5 w-5" /></div>
          <div>
            <div className="font-display text-xl font-bold">RADAR · Conarte</div>
            <div className="text-xs text-muted-foreground">{modo === "entrar" ? "Entre com seu login e senha" : "Criar nova conta"}</div>
          </div>
        </div>
        <label className="block space-y-1 text-sm font-medium">E-mail
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
        </label>
        <label className="block space-y-1 text-sm font-medium">Senha
          <input type="password" required minLength={6} autoComplete={modo === "entrar" ? "current-password" : "new-password"} value={senha} onChange={(e) => setSenha(e.target.value)} className={input} />
        </label>
        <button disabled={busy} className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          {busy ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar conta"}
        </button>
        <button type="button" onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
          {modo === "entrar" ? "Não tem conta? Criar conta" : "Já tenho conta · Entrar"}
        </button>
      </form>
    </div>
  );
}

export async function sair() {
  await supabase.auth.signOut();
}
