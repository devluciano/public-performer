import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Users, FileText, Activity, AlertTriangle } from "lucide-react";
import { useAppState } from "@/lib/storage/app-state";
import { listarUsuarios, excluirUsuarioDb } from "@/lib/services/db-api";
import { toast } from "sonner";

export const Route = createFileRoute("/usuarios")({
  head: () => ({
    meta: [
      { title: "Gerenciador de Usuários — Prompter" },
      { name: "description", content: "Administração de usuários cadastrados no Eloquence Pro." },
    ],
  }),
  component: UsersManagementPage,
});

interface UsuarioItem {
  id: string;
  nome: string;
  email: string;
  criadoEm: string;
  totalRoteiros: number;
  totalTreinos: number;
}

function UsersManagementPage() {
  const { user } = useAppState();
  const navigate = useNavigate();
  const [usersList, setUsersList] = useState<UsuarioItem[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Segurança de rota de administrador
  useEffect(() => {
    if (user && user.email !== "admin@eloquence.pro") {
      void navigate({ to: "/" });
      toast.error("Acesso restrito para administradores.");
    }
  }, [user, navigate]);

  const carregarUsuarios = async () => {
    setCarregando(true);
    try {
      const res = await listarUsuarios();
      setUsersList(res);
    } catch (err) {
      toast.error("Erro ao carregar usuários do banco.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (user?.email === "admin@eloquence.pro") {
      void carregarUsuarios();
    }
  }, [user]);

  const handleExcluirUsuario = async (id: string, email: string) => {
    if (email === "admin@eloquence.pro") {
      toast.error("Não é possível excluir a conta do Administrador principal.");
      return;
    }

    if (!confirm(`Deseja realmente excluir o usuário "${email}"? Essa ação é permanente e apagará todos os roteiros e treinos vinculados!`)) {
      return;
    }

    try {
      await excluirUsuarioDb({ data: id });
      toast.success("Usuário excluído com sucesso!");
      void carregarUsuarios();
    } catch {
      toast.error("Erro ao excluir usuário.");
    }
  };

  return (
    <AppShell title="Gerenciar Usuários" subtitle="Administração e métricas de todos os oradores cadastrados no sistema">
      <div className="space-y-4">
        {/* Métricas consolidadas do administrador */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total de Usuários</CardTitle>
              <Users className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">{usersList.length}</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Oradores registrados no banco</p>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total de Roteiros</CardTitle>
              <FileText className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">
                {usersList.reduce((acc, u) => acc + u.totalRoteiros, 0)}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Discursos criados no sistema</p>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total de Treinos</CardTitle>
              <Activity className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">
                {usersList.reduce((acc, u) => acc + u.totalTreinos, 0)}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Ensaios e análises de voz geradas</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">Lista de Usuários</CardTitle>
            <CardDescription>Visualize o progresso e gerencie as permissões das contas</CardDescription>
          </CardHeader>
          <CardContent>
            {carregando ? (
              <div className="text-center py-8 text-sm text-muted-foreground">Carregando usuários cadastrados...</div>
            ) : usersList.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">Nenhum usuário cadastrado no sistema.</div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border/60">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/40 text-muted-foreground font-semibold text-xs uppercase">
                    <tr>
                      <th className="p-3 border-b border-border/60">Orador</th>
                      <th className="p-3 border-b border-border/60">E-mail</th>
                      <th className="p-3 border-b border-border/60">Perfil</th>
                      <th className="p-3 border-b border-border/60">Cadastrado em</th>
                      <th className="p-3 border-b border-border/60 text-center">Roteiros</th>
                      <th className="p-3 border-b border-border/60 text-center">Treinos</th>
                      <th className="p-3 border-b border-border/60 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((usuario) => (
                      <tr key={usuario.id} className="hover:bg-muted/10 transition-colors border-b border-border/40 last:border-0">
                        <td className="p-3 font-semibold text-foreground">{usuario.nome}</td>
                        <td className="p-3 text-muted-foreground font-mono text-xs">{usuario.email}</td>
                        <td className="p-3">
                          {usuario.email === "admin@eloquence.pro" ? (
                            <Badge className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15">
                              Administrador
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                              Orador
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {new Date(usuario.criadoEm).toLocaleDateString("pt-BR", { dateStyle: "medium" })}
                        </td>
                        <td className="p-3 text-center font-bold text-primary text-xs">{usuario.totalRoteiros}</td>
                        <td className="p-3 text-center font-bold text-primary text-xs">{usuario.totalTreinos}</td>
                        <td className="p-3 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={usuario.email === "admin@eloquence.pro"}
                            className="text-destructive hover:bg-destructive/10 disabled:opacity-30"
                            onClick={() => handleExcluirUsuario(usuario.id, usuario.email)}
                            title="Excluir Usuário"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerta de administrador */}
        <div className="flex gap-2 items-start bg-warning/10 border border-warning/30 rounded-xl p-3 text-xs text-warning leading-relaxed">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Zona Crítica de Administração:</span> A exclusão de um usuário é definitiva e 
            removerá instantaneamente em cascata todas as tabelas e dados vinculados à conta dele no MySQL local.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
