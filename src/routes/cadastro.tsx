import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { cadastrarUsuario } from "@/lib/services/db-api";
import { useActions } from "@/lib/storage/app-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Mic, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Cadastrar-se — Eloquence Pro" },
      { name: "description", content: "Crie sua conta no Eloquence Pro para organizar seus discursos e ensaiar com dados." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useActions();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email || !senha) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    if (senha.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setCarregando(true);
    try {
      const res = await cadastrarUsuario({ data: { nome, email, senha } });
      if (res.success && res.user) {
        login(res.user);
        toast.success(`Conta criada com sucesso! Bem-vindo, ${res.user.nome}.`);
        void navigate({ to: "/" });
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#07090e] px-4 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 rounded-full bg-emerald-500/5 blur-[100px]" />

      <Card className="w-full max-w-sm border-border/60 bg-card/60 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
            <Mic className="size-6" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">Criar Conta</CardTitle>
          <CardDescription>Junte-se à maior plataforma de ensaio de oratória</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="cad-nome">
                Nome completo
              </label>
              <input
                id="cad-nome"
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
                className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="cad-email">
                E-mail
              </label>
              <input
                id="cad-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="cad-senha">
                Senha
              </label>
              <div className="relative">
                <input
                  id="cad-senha"
                  type={showPassword ? "text" : "password"}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-lg border border-input bg-background/50 pl-3 pr-10 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={carregando}>
              {carregando ? "Criando conta..." : "Criar conta"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Já tem uma conta?{" "}
              <Link to="/login" className="text-primary hover:underline font-semibold">
                Faça login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
