import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { loginUsuario } from "@/lib/services/db-api";
import { useActions } from "@/lib/storage/app-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Mic, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Eloquence Pro" },
      { name: "description", content: "Faça login para ensaiar seus discursos no teleprompter e ver sua evolução." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useActions();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setCarregando(true);
    try {
      const res = await loginUsuario({ data: { email, senha } });
      if (res.success && res.user) {
        login(res.user);
        toast.success(`Bem-vindo de volta, ${res.user.nome}!`);
        void navigate({ to: "/" });
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao realizar login.");
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
          <CardTitle className="text-xl font-bold tracking-tight">Eloquence Pro</CardTitle>
          <CardDescription>Acesse sua conta para treinar sua oratória</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="login-email">
                E-mail
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="login-senha">
                Senha
              </label>
              <div className="relative">
                <input
                  id="login-senha"
                  type={showPassword ? "text" : "password"}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Sua senha secreta"
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
              {carregando ? "Acessando..." : "Entrar"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Não tem uma conta?{" "}
              <Link to="/cadastro" className="text-primary hover:underline font-semibold">
                Cadastre-se
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
