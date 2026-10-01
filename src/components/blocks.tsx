import type { ReactNode } from "react";
import { Loader2, AlertTriangle, Inbox } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TODOS, fmtPct } from "@/lib/data";

export function Kpi({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: string | undefined; icon?: ReactNode }) {
  return (
    <div className="panel kpi-accent p-5">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        <span className="text-primary">{icon}</span>
      </div>
      <div className="mt-2 font-display text-4xl font-bold tabular text-graphite">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Panel({ title, subtitle, children, actions }: { title: string; subtitle?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold uppercase">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin text-primary" /> Carregando…
    </div>
  );
}
export function Erro({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      <AlertTriangle className="h-4 w-4" /> Erro ao consultar dados: {msg}
    </div>
  );
}
export function Vazio({ msg = "Sem dados suficientes" }: { msg?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
      <Inbox className="h-6 w-6" /> {msg}
    </div>
  );
}

export function FiltroSelect({ label, value, onChange, options, todosLabel }: { label: string; value: string; onChange: (v: string) => void; options: string[]; todosLabel: string }) {
  return (
    <label className="flex min-w-[200px] flex-1 flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>{todosLabel}</SelectItem>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </label>
  );
}

export function BarrasHorizontais({
  data, valueKey, format, onClick, highlightFirst = true,
}: {
  data: { nome: string; [k: string]: string | number }[];
  valueKey: string;
  format: (v: number) => string;
  onClick?: (d: { nome: string; [k: string]: string | number }) => void;
  highlightFirst?: boolean;
}) {
  if (!data.length) return <Vazio />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 90, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="nome" width={190} tick={{ fontSize: 12, fill: "var(--foreground)" }} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: "var(--muted)" }} formatter={(v: number) => format(v)} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
        <Bar dataKey={valueKey} radius={[0, 4, 4, 0]} barSize={22} onClick={(d: unknown) => onClick?.(d as never)} className={onClick ? "cursor-pointer" : ""}>
          {data.map((_, i) => <Cell key={i} fill={highlightFirst || i === 0 ? "var(--chart-1)" : "var(--chart-2)"} />)}
          <LabelList dataKey={valueKey} position="right" formatter={(v: number) => format(v)} style={{ fontSize: 12, fontWeight: 600, fill: "var(--graphite)" }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export const DesagioBadge = ({ v }: { v: number | null }) => (
  <span className={`tabular font-semibold ${v != null && v < 0 ? "text-destructive" : "text-accent-foreground"}`}>{fmtPct(v)}</span>
);
