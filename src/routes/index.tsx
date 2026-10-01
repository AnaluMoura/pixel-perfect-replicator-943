import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileText, Percent, Wallet, Trophy } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { BarrasHorizontais, DesagioBadge, Erro, FiltroSelect, Kpi, Loading, Panel } from "@/components/blocks";
import { TODOS, filtrar, fmtBRL, fmtBRLc, fmtData, fmtPct, media, mediaPor, ranking, useLicitacoes, useLista } from "@/lib/data";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dashboard · Radar de Concorrentes Conarte" },
      { name: "description", content: "Vitórias, deságio médio e ranking dos concorrentes em licitações públicas." },
      { property: "og:title", content: "Dashboard · Radar de Concorrentes Conarte" },
      { property: "og:description", content: "Vitórias, deságio médio e ranking dos concorrentes em licitações públicas." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const nav = useNavigate();
  const [tipo, setTipo] = useState(TODOS);
  const [orgao, setOrgao] = useState(TODOS);
  const lic = useLicitacoes();
  const tipos = useLista("tipos_obra");
  const orgaos = useLista("orgaos_publicos");

  const rows = useMemo(() => filtrar(lic.data ?? [], tipo, orgao), [lic.data, tipo, orgao]);
  const top = useMemo(() => ranking(rows), [rows]);
  const porTipo = useMemo(() => mediaPor(rows, "tipo_obra"), [rows]);
  const total = rows.reduce((s, r) => s + r.valor_estimado, 0);
  const conarte = rows.filter((r) => r.concorrentes?.nome_empresa === "CONARTE").length;

  return (
    <>
      <PageHeader title="Radar de Concorrentes" subtitle="Visão geral do histórico de resultados de licitações" />

      <div className="panel mb-6 flex flex-wrap gap-4 p-4">
        <FiltroSelect label="Tipo de obra" value={tipo} onChange={setTipo} options={tipos.data ?? []} todosLabel="Todas as obras" />
        <FiltroSelect label="Órgão público" value={orgao} onChange={setOrgao} options={orgaos.data ?? []} todosLabel="Todos os órgãos" />
      </div>

      {lic.isLoading ? <Loading /> : lic.error ? <Erro msg={(lic.error as Error).message} /> : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Licitações registradas" value={rows.length} hint="Editais no histórico filtrado" icon={<FileText className="h-4 w-4" />} />
            <Kpi label="Deságio médio" value={fmtPct(media(rows))} hint="Média aritmética dos descontos" icon={<Percent className="h-4 w-4" />} />
            <Kpi label="Volume estimado" value={fmtBRLc(total)} hint={fmtBRL(total)} icon={<Wallet className="h-4 w-4" />} />
            <Kpi label="Vitórias Conarte" value={conarte} hint={rows.length ? `${((conarte / rows.length) * 100).toFixed(1).replace(".", ",")}% do total` : undefined} icon={<Trophy className="h-4 w-4" />} />
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <Panel title="Top 5 — Mais vitórias" subtitle="Clique numa empresa para abrir o perfil">
              <BarrasHorizontais
                data={top}
                valueKey="vitorias"
                format={(v) => `${v} ${v === 1 ? "vitória" : "vitórias"}`}
                highlightFirst={false}
                onClick={(d) => nav({ to: "/concorrentes/$id", params: { id: String(d.id) } })}
              />
            </Panel>
            <Panel title="Deságio médio por tipo de obra">
              <BarrasHorizontais data={porTipo} valueKey="media" format={(v) => fmtPct(v)} />
            </Panel>
          </div>

          <Panel title="Resultados recentes" actions={<Link to="/licitacoes" className="text-sm font-semibold text-primary hover:underline">Ver todos →</Link>}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr><th className="py-2 pr-4">Data</th><th className="pr-4">Edital</th><th className="pr-4">Órgão</th><th className="pr-4">Tipo</th><th className="pr-4">Vencedora</th><th className="pr-4 text-right">Estimado</th><th className="text-right">Deságio</th></tr>
                </thead>
                <tbody>
                  {rows.slice(0, 8).map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2.5 pr-4 tabular">{fmtData(r.data_sessao)}</td>
                      <td className="pr-4">{r.edital}</td>
                      <td className="pr-4">{r.orgao_publico}</td>
                      <td className="pr-4">{r.tipo_obra}</td>
                      <td className="pr-4"><Link to="/concorrentes/$id" params={{ id: r.concorrente_vencedor_id }} className="font-medium hover:text-primary">{r.concorrentes?.nome_empresa}</Link></td>
                      <td className="pr-4 text-right tabular">{fmtBRL(r.valor_estimado)}</td>
                      <td className="text-right"><DesagioBadge v={r.percentual_desconto} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </>
  );
}
