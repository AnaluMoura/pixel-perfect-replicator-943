import { Link } from "@tanstack/react-router";
import { LayoutDashboard, FilePlus2, Building2, ListChecks, Radar, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/licitacoes", label: "Licitações", icon: ListChecks },
  { to: "/licitacoes/nova", search: { id: undefined }, label: "Cadastrar resultado", icon: FilePlus2 },
  { to: "/concorrentes", label: "Concorrentes", icon: Building2 },
] as const;

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {items.map(({ to, label, icon: Icon, ...rest }) => (
        <Link
          key={to}
          to={to}
          {...("search" in rest ? { search: rest.search } : {})}
          onClick={onNavigate}
          activeOptions={{ exact: true }}
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground" }}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-6 py-6">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
        <Radar className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div className="font-display text-lg font-bold tracking-wide text-sidebar-accent-foreground">RADAR</div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground">Conarte · Licitações</div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-sidebar lg:flex">
        <Brand />
        <Nav />
        <div className="mt-auto border-t border-sidebar-border px-6 py-4 text-xs text-sidebar-foreground">
          Inteligência competitiva de preços
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between bg-sidebar px-4 py-3 lg:hidden">
        <div className="font-display text-lg font-bold text-sidebar-accent-foreground">RADAR · Conarte</div>
        <button aria-label="Abrir menu" onClick={() => setOpen(true)} className="text-sidebar-accent-foreground">
          <Menu className="h-6 w-6" />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-graphite/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-sidebar">
            <button aria-label="Fechar menu" onClick={() => setOpen(false)} className="absolute right-3 top-3 text-sidebar-foreground">
              <X className="h-5 w-5" />
            </button>
            <Brand />
            <Nav onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="mb-1 h-1 w-10 rounded bg-primary" />
        <h1 className="text-3xl font-bold uppercase">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
