import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { DesagioBadge, Erro, FiltroSelect, Loading, Vazio } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { TODOS, filtrar, fmtBRL, fmtData, useInvalidateAll, useLicitacoes, useLista } from "@/lib/data";

export const Route = createFileRoute("/licitacoes/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Licitações · Radar Conarte" },
      { name: "description", content: "Histórico completo de resultados de licitações públicas." },
      { property: "og:title", content: "Licitações · Radar Conarte" },
      { property: "og:description", content: "Histórico completo de resultados de licitações públicas." },
    ],
  }),
  component: Licitacoes,
});

function Licitacoes() {
  const lic = useLicitacoes();
  const tipos = useLista("tipos_obra");
  const orgaos = useLista("orgaos_publicos");
  const invalidate = useInvalidateAll();
  const [tipo, setTipo] = useState(TODOS);
  const [orgao, setOrgao] = useState(TODOS);
  const [busca, setBusca] = useState("");

  const rows = useMemo(() => {
    const b = busca.toLowerCase();
    return filtrar(lic.data ?? [], tipo, orgao).filter((r) => !b || r.edital.toLowerCase().includes(b) || (r.objeto ?? "").toLowerCase().includes(b) || (r.concorrentes?.nome_empresa ?? "").toLowerCase().includes(b));
  }, [lic.data, tipo, orgao, busca]);

  async function excluir(id: string) {
    if (!confirm("Excluir este resultado?")) return;
    const { error } = await supabase.from("licitacoes").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Resultado excluído.");
    invalidate();
  }

  return (
    <>
      <PageHeader title="Licitações" subtitle={`${rows.length} resultados`} actions={<Button asChild><Link to="/licitacoes/nova" search={{ id: undefined }}><Plus className="h-4 w-4" /> Cadastrar resultado</Link></Button>} />
      <div className="panel mb-6 flex flex-wrap gap-4 p-4">
        <label className="flex min-w-[200px] flex-1 flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Buscar</span>
          <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="bg-card pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Edital, objeto ou empresa" /></div>
        </label>
        <FiltroSelect label="Tipo de obra" value={tipo} onChange={setTipo} options={tipos.data ?? []} todosLabel="Todas as obras" />
        <FiltroSelect label="Órgão público" value={orgao} onChange={setOrgao} options={orgaos.data ?? []} todosLabel="Todos os órgãos" />
      </div>
      <div className="panel p-5">
        {lic.isLoading ? <Loading /> : lic.error ? <Erro msg={(lic.error as Error).message} /> : !rows.length ? <Vazio msg="Nenhum resultado encontrado" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="py-2 pr-4">Data</th><th className="pr-4">Edital</th><th className="pr-4">Órgão</th><th className="pr-4">Tipo</th><th className="pr-4">Vencedora</th><th className="pr-4 text-right">Estimado</th><th className="pr-4 text-right">Vencedor</th><th className="pr-4 text-right">Deságio</th><th /></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t align-top">
                    <td className="py-2.5 pr-4 tabular">{fmtData(r.data_sessao)}</td>
                    <td className="pr-4 py-2.5">
                      <div className="font-medium">{r.edital}</div>
                      {r.objeto && <div className="line-clamp-1 max-w-xs text-xs text-muted-foreground" title={r.objeto}>{r.objeto}</div>}
                    </td>
                    <td className="py-2.5 pr-4">{r.orgao_publico}</td>
                    <td className="py-2.5 pr-4">{r.tipo_obra}</td>
                    <td className="py-2.5 pr-4"><Link to="/concorrentes/$id" params={{ id: r.concorrente_vencedor_id }} className="hover:text-primary">{r.concorrentes?.nome_empresa}</Link></td>
                    <td className="py-2.5 pr-4 text-right tabular">{fmtBRL(r.valor_estimado)}</td>
                    <td className="py-2.5 pr-4 text-right tabular">{fmtBRL(r.valor_vencedor)}</td>
                    <td className="py-2.5 pr-4 text-right"><DesagioBadge v={r.percentual_desconto} /></td>
                    <td className="whitespace-nowrap py-1 text-right">
                      <Button size="icon" variant="ghost" asChild aria-label="Editar"><Link to="/licitacoes/nova" search={{ id: r.id }}><Pencil className="h-4 w-4" /></Link></Button>
                      <Button size="icon" variant="ghost" aria-label="Excluir" onClick={() => excluir(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
