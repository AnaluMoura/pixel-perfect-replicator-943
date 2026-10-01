import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { PageHeader } from "@/components/AppShell";
import { ConcorrenteDialog } from "@/components/ConcorrenteDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { calcDesagio, fmtPct, parseMoeda, useConcorrentes, useInvalidateAll, useLicitacoes, useLista } from "@/lib/data";

export const Route = createFileRoute("/licitacoes/nova")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ id: typeof s["id"] === "string" ? (s["id"] as string) : undefined }),
  head: () => ({
    meta: [
      { title: "Cadastrar resultado · Radar Conarte" },
      { name: "description", content: "Registre o resultado de uma licitação e veja o deságio calculado." },
      { property: "og:title", content: "Cadastrar resultado · Radar Conarte" },
      { property: "og:description", content: "Registre o resultado de uma licitação e veja o deságio calculado." },
    ],
  }),
  component: Form,
});

const vazio = { edital: "", orgao: "", tipo: "", objeto: "", estimado: "", vencedor: "", empresa: "", data: "" };

const schema = z.object({
  edital: z.string().trim().min(1, "Informe o edital").max(100),
  orgao: z.string().min(1, "Selecione o órgão"),
  tipo: z.string().min(1, "Selecione o tipo de obra"),
  empresa: z.string().min(1, "Selecione a empresa vencedora"),
  objeto: z.string().max(2000),
});

function NovaOpcao({ tabela, onCreated }: { tabela: "tipos_obra" | "orgaos_publicos"; onCreated: (n: string) => void }) {
  const [v, setV] = useState("");
  const invalidate = useInvalidateAll();
  async function add() {
    const nome = v.trim();
    if (!nome || nome.length > 120) return;
    const { error } = await supabase.from(tabela).insert({ nome });
    if (error && error.code !== "23505") { toast.error(error.message); return; }
    await invalidate();
    onCreated(nome);
    setV("");
  }
  return (
    <div className="mt-2 flex gap-2">
      <Input value={v} onChange={(e) => setV(e.target.value)} placeholder="Nova opção…" className="h-8 text-xs" />
      <Button type="button" size="sm" variant="outline" onClick={add}><Plus className="h-3.5 w-3.5" /></Button>
    </div>
  );
}

function Form() {
  const { id } = Route.useSearch();
  const nav = useNavigate();
  const router = useRouter();
  const invalidate = useInvalidateAll();
  const tipos = useLista("tipos_obra");
  const orgaos = useLista("orgaos_publicos");
  const conc = useConcorrentes();
  const lic = useLicitacoes();
  const [f, setF] = useState(vazio);
  const [saving, setSaving] = useState(false);
  const [dlg, setDlg] = useState(false);
  const set = (k: keyof typeof vazio) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!id || !lic.data) return;
    const r = lic.data.find((l) => l.id === id);
    if (r) setF({
      edital: r.edital, orgao: r.orgao_publico, tipo: r.tipo_obra, objeto: r.objeto ?? "",
      estimado: r.valor_estimado.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
      vencedor: r.valor_vencedor.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
      empresa: r.concorrente_vencedor_id, data: r.data_sessao ?? "",
    });
  }, [id, lic.data]);

  const est = parseMoeda(f.estimado);
  const ven = parseMoeda(f.vencedor);
  const des = calcDesagio(est, ven);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const p = schema.safeParse(f);
    if (!p.success) { toast.error(p.error.issues[0]?.message ?? "Dados inválidos"); return; }
    if (!(est > 0)) { toast.error("Valor estimado deve ser maior que zero."); return; }
    if (!(ven > 0)) { toast.error("Valor vencedor deve ser maior que zero."); return; }
    setSaving(true);
    const payload = {
      edital: f.edital.trim(), orgao_publico: f.orgao, tipo_obra: f.tipo, objeto: f.objeto.trim() || null,
      valor_estimado: est, valor_vencedor: ven, concorrente_vencedor_id: f.empresa, data_sessao: f.data || null,
    };
    const { error } = id ? await supabase.from("licitacoes").update(payload).eq("id", id) : await supabase.from("licitacoes").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(id ? "Resultado atualizado." : "Resultado salvo.");
    await invalidate();
    nav({ to: "/licitacoes" });
  }

  return (
    <>
      <PageHeader title={id ? "Editar resultado" : "Cadastrar resultado"} subtitle="O deságio é calculado automaticamente" />
      <form onSubmit={salvar} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="panel grid gap-5 p-6 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2"><Label>Número / identificação do edital *</Label><Input value={f.edital} onChange={(e) => set("edital")(e.target.value)} maxLength={100} /></div>
          <div className="grid gap-1.5">
            <Label>Órgão público *</Label>
            <Select value={f.orgao} onValueChange={set("orgao")}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{(orgaos.data ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
            <NovaOpcao tabela="orgaos_publicos" onCreated={set("orgao")} />
          </div>
          <div className="grid gap-1.5">
            <Label>Tipo de obra *</Label>
            <Select value={f.tipo} onValueChange={set("tipo")}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{(tipos.data ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
            <NovaOpcao tabela="tipos_obra" onCreated={set("tipo")} />
          </div>
          <div className="grid gap-1.5 sm:col-span-2"><Label>Objeto</Label><Textarea value={f.objeto} onChange={(e) => set("objeto")(e.target.value)} maxLength={2000} rows={2} /></div>
          <div className="grid gap-1.5"><Label>Valor estimado (R$) *</Label><Input inputMode="decimal" value={f.estimado} onChange={(e) => set("estimado")(e.target.value)} placeholder="1.000.000,00" /></div>
          <div className="grid gap-1.5"><Label>Valor final vencedor (R$) *</Label><Input inputMode="decimal" value={f.vencedor} onChange={(e) => set("vencedor")(e.target.value)} placeholder="850.000,00" /></div>
          <div className="grid gap-1.5">
            <Label>Empresa vencedora *</Label>
            <Select value={f.empresa} onValueChange={set("empresa")}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{(conc.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.nome_empresa}</SelectItem>)}</SelectContent></Select>
            <button type="button" onClick={() => setDlg(true)} className="mt-1 text-left text-xs font-semibold text-primary hover:underline">+ Cadastrar nova empresa</button>
          </div>
          <div className="grid gap-1.5"><Label>Data da sessão</Label><Input type="date" value={f.data} onChange={(e) => set("data")(e.target.value)} /></div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="panel kpi-accent p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prévia do deságio</div>
            <div className={`mt-2 font-display text-5xl font-bold tabular ${des != null && des < 0 ? "text-destructive" : "text-primary"}`}>{fmtPct(des)}</div>
            <p className="mt-2 text-xs text-muted-foreground">(Estimado − Vencedor) ÷ Estimado × 100</p>
            {des != null && des < 0 && <p className="mt-3 flex gap-1.5 text-xs text-destructive"><AlertTriangle className="h-4 w-4 shrink-0" /> Valor vencedor acima do estimado — confira os dados.</p>}
          </div>
          <Button type="submit" size="lg" disabled={saving}>{saving ? "Salvando…" : "Salvar resultado"}</Button>
          <Button type="button" variant="outline" onClick={() => setF(vazio)}>Limpar formulário</Button>
          <Button type="button" variant="ghost" onClick={() => router.history.back()}>Cancelar</Button>
        </aside>
      </form>
      <ConcorrenteDialog open={dlg} onOpenChange={setDlg} onSaved={(c) => set("empresa")(c.id)} />
    </>
  );
}
