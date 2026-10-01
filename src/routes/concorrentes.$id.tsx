import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { BarrasHorizontais, DesagioBadge, Erro, FiltroSelect, Kpi, Loading, Panel, Vazio } from "@/components/blocks";
import { TODOS, filtrar, fmtBRL, fmtCNPJ, fmtData, fmtPct, media, mediaPor, useConcorrentes, useLicitacoes } from "@/lib/data";

export const Route = createFileRoute("/concorrentes/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Perfil do concorrente · Radar Conarte" },
      { name: "description", content: "Histórico de vitórias e deságio médio do concorrente por tipo de obra e órgão." },
      { property: "og:title", content: "Perfil do concorrente · Radar Conarte" },
      { property: "og:description", content: "Histórico de vitórias e deságio médio do concorrente." },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const { id } = Route.useParams();
  const conc = useConcorrentes();
  const lic = useLicitacoes();
  const [tipo, setTipo] = useState(TODOS);
  const [orgao, setOrgao] = useState(TODOS);

  const empresa = conc.data?.find((c) => c.id === id);
  const todas = useMemo(() => (lic.data ?? []).filter((l) => l.concorrente_vencedor_id === id), [lic.data, id]);
  const rows = useMemo(() => filtrar(todas, tipo, orgao), [todas, tipo, orgao]);
  const tipos = [...new Set(todas.map((r) => r.tipo_obra))].sort();
  const orgaos = [...new Set(todas.map((r) => r.orgao_publico))].sort();

  if (conc.isLoading || lic.isLoading) return <Loading />;
  if (conc.error || lic.error) return <Erro msg={((conc.error || lic.error) as Error).message} />;
  if (!empresa) return <Vazio msg="Concorrente não encontrado" />;

  return (
    <>
      <Link to="/concorrentes" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Concorrentes</Link>
      <PageHeader title={empresa.nome_empresa} subtitle={`CNPJ: ${fmtCNPJ(empresa.cnpj)}`} />

      <div className="panel mb-6 flex flex-wrap gap-4 p-4">
        <FiltroSelect label="Tipo de obra" value={tipo} onChange={setTipo} options={tipos} todosLabel="Todas as obras" />
        <FiltroSelect label="Órgão público" value={orgao} onChange={setOrgao} options={orgaos} todosLabel="Todos os órgãos" />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Kpi label="Licitações vencidas" value={rows.length} />
        <Kpi label="Deságio médio geral" value={fmtPct(media(rows))} />
        <Kpi label="Volume vencido" value={fmtBRL(rows.reduce((s, r) => s + r.valor_vencedor, 0))} />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Deságio médio por tipo de obra"><BarrasHorizontais data={mediaPor(rows, "tipo_obra")} valueKey="media" format={(v) => fmtPct(v)} /></Panel>
        <Panel title="Deságio médio por órgão público"><BarrasHorizontais data={mediaPor(rows, "orgao_publico")} valueKey="media" format={(v) => fmtPct(v)} /></Panel>
      </div>

      <Panel title="Histórico de vitórias">
        {!rows.length ? <Vazio /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="py-2 pr-4">Data</th><th className="pr-4">Edital</th><th className="pr-4">Órgão</th><th className="pr-4">Tipo</th><th className="pr-4 text-right">Estimado</th><th className="pr-4 text-right">Vencedor</th><th className="text-right">Deságio</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2.5 pr-4 tabular">{fmtData(r.data_sessao)}</td>
                    <td className="pr-4">{r.edital}</td>
                    <td className="pr-4">{r.orgao_publico}</td>
                    <td className="pr-4">{r.tipo_obra}</td>
                    <td className="pr-4 text-right tabular">{fmtBRL(r.valor_estimado)}</td>
                    <td className="pr-4 text-right tabular">{fmtBRL(r.valor_vencedor)}</td>
                    <td className="text-right"><DesagioBadge v={r.percentual_desconto} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
