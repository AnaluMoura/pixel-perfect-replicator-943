import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Concorrente = { id: string; nome_empresa: string; cnpj: string | null; created_at: string };
export type Licitacao = {
  id: string;
  edital: string;
  orgao_publico: string;
  tipo_obra: string;
  objeto: string | null;
  valor_estimado: number;
  valor_vencedor: number;
  percentual_desconto: number | null;
  data_sessao: string | null;
  concorrente_vencedor_id: string;
  concorrentes?: { nome_empresa: string } | null;
};

export const TODOS = "__todos__";

export function useLicitacoes() {
  return useQuery({
    queryKey: ["licitacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("licitacoes")
        .select("*, concorrentes(nome_empresa)")
        .order("data_sessao", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...r,
        valor_estimado: Number(r.valor_estimado),
        valor_vencedor: Number(r.valor_vencedor),
        percentual_desconto: r.percentual_desconto == null ? null : Number(r.percentual_desconto),
      })) as Licitacao[];
    },
  });
}

export function useConcorrentes() {
  return useQuery({
    queryKey: ["concorrentes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("concorrentes").select("*").order("nome_empresa");
      if (error) throw error;
      return data as Concorrente[];
    },
  });
}

export function useLista(tabela: "tipos_obra" | "orgaos_publicos") {
  return useQuery({
    queryKey: [tabela],
    queryFn: async () => {
      const { data, error } = await supabase.from(tabela).select("nome").order("nome");
      if (error) throw error;
      return (data ?? []).map((d) => d.nome);
    },
  });
}

export function useInvalidateAll() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}

export function filtrar(rows: Licitacao[], tipo: string, orgao: string) {
  return rows.filter(
    (r) => (tipo === TODOS || r.tipo_obra === tipo) && (orgao === TODOS || r.orgao_publico === orgao),
  );
}

const validos = (rows: Licitacao[]) =>
  rows.filter((r) => r.valor_estimado > 0 && r.valor_vencedor > 0 && r.percentual_desconto != null);

export function media(rows: Licitacao[]): number | null {
  const v = validos(rows);
  if (!v.length) return null;
  return v.reduce((s, r) => s + (r.percentual_desconto as number), 0) / v.length;
}

export function mediaPor(rows: Licitacao[], campo: "tipo_obra" | "orgao_publico") {
  const g = new Map<string, Licitacao[]>();
  for (const r of validos(rows)) g.set(r[campo], [...(g.get(r[campo]) ?? []), r]);
  return [...g.entries()]
    .map(([nome, rs]) => ({ nome, media: media(rs) as number, qtd: rs.length }))
    .sort((a, b) => b.media - a.media);
}

export function ranking(rows: Licitacao[], n = 5) {
  const g = new Map<string, { id: string; nome: string; vitorias: number }>();
  for (const r of rows) {
    const nome = r.concorrentes?.nome_empresa ?? "—";
    const cur = g.get(r.concorrente_vencedor_id) ?? { id: r.concorrente_vencedor_id, nome, vitorias: 0 };
    cur.vitorias++;
    g.set(r.concorrente_vencedor_id, cur);
  }
  return [...g.values()]
    .sort((a, b) => b.vitorias - a.vitorias || a.nome.localeCompare(b.nome, "pt-BR"))
    .slice(0, n);
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brlCompact = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });
export const fmtBRL = (v: number) => brl.format(v);
export const fmtBRLc = (v: number) => brlCompact.format(v);
export const fmtPct = (v: number | null) =>
  v == null ? "—" : `${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
export const fmtData = (d: string | null) => (d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—");

export const calcDesagio = (est: number, ven: number) => (est > 0 && ven > 0 ? ((est - ven) / est) * 100 : null);

export const soDigitos = (s: string) => s.replace(/\D/g, "");
export function fmtCNPJ(c: string | null) {
  if (!c) return "Não informado";
  return c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}
export function cnpjValido(raw: string) {
  const c = soDigitos(raw);
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  const dv = (base: string) => {
    let soma = 0;
    let peso = base.length - 7;
    for (const ch of base) {
      soma += Number(ch) * peso--;
      if (peso < 2) peso = 9;
    }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = dv(c.slice(0, 12));
  const d2 = dv(c.slice(0, 12) + d1);
  return c.endsWith(`${d1}${d2}`);
}

/** Converte "1.234.567,89" ou "1234567.89" em número */
export function parseMoeda(s: string): number {
  if (!s) return 0;
  const t = s.replace(/[^\d,.-]/g, "");
  const n = t.includes(",") ? Number(t.replace(/\./g, "").replace(",", ".")) : Number(t);
  return Number.isFinite(n) ? n : 0;
}
