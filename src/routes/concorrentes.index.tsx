import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Erro, Loading, Vazio } from "@/components/blocks";
import { ConcorrenteDialog } from "@/components/ConcorrenteDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { fmtCNPJ, fmtPct, media, useConcorrentes, useInvalidateAll, useLicitacoes, type Concorrente } from "@/lib/data";

export const Route = createFileRoute("/concorrentes/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Concorrentes · Radar Conarte" },
      { name: "description", content: "Cadastro de empresas concorrentes com vitórias e deságio médio." },
      { property: "og:title", content: "Concorrentes · Radar Conarte" },
      { property: "og:description", content: "Cadastro de empresas concorrentes com vitórias e deságio médio." },
    ],
  }),
  component: Concorrentes,
});

function Concorrentes() {
  const conc = useConcorrentes();
  const lic = useLicitacoes();
  const invalidate = useInvalidateAll();
  const [busca, setBusca] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Concorrente | null>(null);

  const lista = useMemo(() => {
    const all = lic.data ?? [];
    return (conc.data ?? [])
      .filter((c) => c.nome_empresa.toLowerCase().includes(busca.toLowerCase()))
      .map((c) => {
        const rs = all.filter((l) => l.concorrente_vencedor_id === c.id);
        return { ...c, vitorias: rs.length, media: media(rs) };
      })
      .sort((a, b) => b.vitorias - a.vitorias || a.nome_empresa.localeCompare(b.nome_empresa, "pt-BR"));
  }, [conc.data, lic.data, busca]);

  async function excluir(c: (typeof lista)[number]) {
    if (c.vitorias > 0) return toast.error(`Não é possível excluir: ${c.vitorias} licitação(ões) vinculada(s). Reatribua ou exclua os resultados antes.`);
    if (!confirm(`Excluir ${c.nome_empresa}?`)) return;
    const { error } = await supabase.from("concorrentes").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Concorrente excluído.");
    invalidate();
  }

  return (
    <>
      <PageHeader title="Concorrentes" subtitle={`${conc.data?.length ?? 0} empresas cadastradas`} actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> Novo concorrente</Button>} />
      <div className="panel p-5">
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar empresa…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        {conc.isLoading || lic.isLoading ? <Loading /> : conc.error ? <Erro msg={(conc.error as Error).message} /> : !lista.length ? <Vazio msg="Nenhum concorrente encontrado" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="py-2 pr-4">Empresa</th><th className="pr-4">CNPJ</th><th className="pr-4 text-right">Vitórias</th><th className="pr-4 text-right">Deságio médio</th><th /></tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="py-2.5 pr-4"><Link to="/concorrentes/$id" params={{ id: c.id }} className="font-medium hover:text-primary">{c.nome_empresa}</Link></td>
                    <td className="pr-4 tabular text-muted-foreground">{fmtCNPJ(c.cnpj)}</td>
                    <td className="pr-4 text-right tabular font-semibold">{c.vitorias}</td>
                    <td className="pr-4 text-right tabular">{fmtPct(c.media)}</td>
                    <td className="whitespace-nowrap text-right">
                      <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Excluir" onClick={() => excluir(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ConcorrenteDialog open={open} onOpenChange={setOpen} editing={editing} />
    </>
  );
}
