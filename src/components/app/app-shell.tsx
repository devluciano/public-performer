import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { BarChart3, Files, History, LayoutDashboard, Mic, Settings, Users, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useActions, useAppState } from "@/lib/storage/app-state";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/roteiros", label: "Roteiros", icon: Files },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/estatisticas", label: "Estatísticas", icon: BarChart3 },
  { to: "/configuracoes", label: "Ajustes", icon: Settings },
] as const;

function isActive(pathname: string, to: string) {
  return to === "/" ? pathname === "/" : pathname.startsWith(to);
}

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAppState();
  const { logout } = useActions();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Sessão encerrada com sucesso!");
    void navigate({ to: "/login" });
  };

  const menuItems = [
    ...NAV,
    ...(user?.email === "admin@eloquence.pro"
      ? [{ to: "/usuarios", label: "Usuários", icon: Users }]
      : []),
  ];

  return (
    <div className="min-h-screen surface-grid">
      {/* Barra lateral fixa (Desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 lg:flex">
        <div className="flex items-center gap-2 px-2 pb-6">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Mic className="size-5" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold">Prompter</p>
            <p className="text-xs text-muted-foreground">Treino de oratória</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {menuItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive(pathname, to) && "bg-sidebar-accent text-sidebar-primary",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Rodapé da Barra Lateral com dados do usuário e botão Sair */}
        <div className="mt-auto border-t border-sidebar-border/40 pt-4 px-2">
          {user && (
            <div className="mb-3 px-2 flex flex-col min-w-0">
              <span className="text-xs font-semibold text-sidebar-foreground/90 truncate">{user.nome}</span>
              <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors duration-150"
          >
            <LogOut className="size-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <div>
              <h1 className="font-display text-xl font-semibold sm:text-2xl">{title}</h1>
              {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
            <div className="flex items-center gap-2">
              {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
              {/* Botão de sair no mobile (topo direito) */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 lg:hidden"
                title="Sair do sistema"
              >
                <LogOut className="size-4.5" />
              </Button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12 flex flex-col min-h-[calc(100vh-73px)]">
          <div className="flex-1">{children}</div>
          <footer className="mt-12 border-t border-border/40 pt-6 pb-2 text-center text-xs text-muted-foreground">
            Desenvolvido por{" "}
            <a
              href="https://leancode.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium transition-colors"
            >
              Leancode Sistemas
            </a>
          </footer>
        </main>
      </div>

      {/* Menu inferior (Mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur lg:hidden">
        {menuItems.slice(0, 5).map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground",
              isActive(pathname, to) && "text-primary",
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
