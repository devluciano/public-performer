"use server";

import { createServerFn } from "@tanstack/react-start";
import { query } from "./db";
import crypto from "crypto";
import { z } from "zod";

// Helper para gerar hash de senha
function hashSenha(senha: string): string {
  return crypto.createHash("sha256").update(senha).digest("hex");
}

// Rodar migrações necessárias para adaptar a tabela perfil ao multi-usuário e corrigir colunas
async function rodarMigracoes() {
  try {
    // 1. Tabela perfil
    // Para contornar erros de restrição no MySQL/MariaDB, alteramos diretamente o tipo da coluna id
    await query("ALTER TABLE perfil MODIFY COLUMN id VARCHAR(36)");
  } catch (error) {}

  try {
    // Tenta remover a restrição caso ela ainda exista (sem o IF EXISTS que causa erro de sintaxe em versões antigas do MySQL)
    await query("ALTER TABLE perfil DROP CONSTRAINT check_single_row");
  } catch (error) {}

  try {
    // 2. Tabela roteiros
    // Adicionar coluna usuario_id se não existir
    await query("ALTER TABLE roteiros ADD COLUMN IF NOT EXISTS usuario_id VARCHAR(36)");
  } catch (error) {}

  try {
    // Adicionar coluna atualizado_em se não existir
    await query("ALTER TABLE roteiros ADD COLUMN IF NOT EXISTS atualizado_em DATETIME");
  } catch (error) {}

  try {
    // 3. Tabela sessoes_treino
    // Adicionar coluna usuario_id se não existir
    await query("ALTER TABLE sessoes_treino ADD COLUMN IF NOT EXISTS usuario_id VARCHAR(36)");
  } catch (error) {}
}

// -------------------------------------------------------------
// Autenticação
// -------------------------------------------------------------

export const cadastrarUsuario = createServerFn({ method: "POST" })
  .validator(
    z.object({
      nome: z.string(),
      email: z.string(),
      senha: z.string(),
    })
  )
  .handler(async ({ data }) => {
    try {
      await rodarMigracoes();
      const usuarioId = crypto.randomUUID();
      const senhaHash = hashSenha(data.senha);
      const agora = new Date();

      // Inserir usuário
      await query(
        "INSERT INTO usuarios (id, nome, email, senha, criado_em) VALUES (?, ?, ?, ?, ?)",
        [usuarioId, data.nome, data.email, senhaHash, agora]
      );

      // Inserir perfil padrão para este usuário
      await query(
        `INSERT INTO perfil (id, nome, configuracoes_padrao, meta_sessoes_semana, pontos, conquistas) 
         VALUES (?, ?, ?, 3, 0, '[]')`,
        [
          usuarioId,
          data.nome,
          JSON.stringify({
            wpm: 140,
            fontSize: 46,
            lineHeight: 1.5,
            readingWidth: 72,
            contrast: 100,
            theme: "dark",
            mirrored: false,
            align: "center",
            level: "iniciante",
          }),
        ]
      );

      return { success: true, user: { id: usuarioId, nome: data.nome, email: data.email } };
    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("Este e-mail já está cadastrado.");
      }
      throw error;
    }
  });

export const loginUsuario = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string(),
      senha: z.string(),
    })
  )
  .handler(async ({ data }) => {
    try {
      await rodarMigracoes();
      
      // Seed silencioso de admin se não existir ou se precisar garantir a senha
      const hashAdmin = hashSenha("admin123");
      const adminExists = await query<any[]>("SELECT * FROM usuarios WHERE email = 'admin@eloquence.pro'");
      if (adminExists.length === 0) {
        const adminId = "admin-uuid-1111-2222-333333333333";
        await query(
          "INSERT INTO usuarios (id, nome, email, senha, criado_em) VALUES (?, 'Administrador', 'admin@eloquence.pro', ?, NOW())",
          [adminId, hashAdmin]
        );
        await query(
          `INSERT IGNORE INTO perfil (id, nome, configuracoes_padrao, meta_sessoes_semana, pontos, conquistas) 
           VALUES (?, 'Administrador', ?, 3, 0, '[]')`,
          [
            adminId,
            JSON.stringify({
              wpm: 140,
              fontSize: 46,
              lineHeight: 1.5,
              readingWidth: 72,
              contrast: 100,
              theme: "dark",
              mirrored: false,
              align: "center",
              level: "iniciante",
            }),
          ]
        );
      } else {
        // Garantir que a senha do admin no banco seja o hash correto de admin123
        await query("UPDATE usuarios SET senha = ? WHERE email = 'admin@eloquence.pro'", [hashAdmin]);
      }

      const senhaHash = hashSenha(data.senha);
      const rows = await query<any[]>(
        "SELECT id, nome, email FROM usuarios WHERE email = ? AND senha = ?",
        [data.email, senhaHash]
      );

      if (rows.length === 0) {
        throw new Error("E-mail ou senha incorretos.");
      }

      return { success: true, user: { id: rows[0].id, nome: rows[0].nome, email: rows[0].email } };
    } catch (error) {
      console.error("Erro no login:", error);
      throw error;
    }
  });

// -------------------------------------------------------------
// Sincronização de dados por usuário
// -------------------------------------------------------------

export const obterDadosIniciais = createServerFn({ method: "POST" })
  .validator(
    z.object({
      usuarioId: z.string(),
    })
  )
  .handler(async ({ data }) => {
    try {
      await rodarMigracoes();
      
      // Buscar perfil
      let perfilRows = await query<any[]>("SELECT * FROM perfil WHERE id = ?", [data.usuarioId]);
      if (perfilRows.length === 0) {
        // Fallback de segurança se o perfil sumiu
        await query(
          `INSERT INTO perfil (id, nome, configuracoes_padrao, meta_sessoes_semana, pontos, conquistas) 
           VALUES (?, 'Orador', ?, 3, 0, '[]')`,
          [
            data.usuarioId,
            JSON.stringify({
              wpm: 140,
              fontSize: 46,
              lineHeight: 1.5,
              readingWidth: 72,
              contrast: 100,
              theme: "dark",
              mirrored: false,
              align: "center",
              level: "iniciante",
            }),
          ]
        );
        perfilRows = await query<any[]>("SELECT * FROM perfil WHERE id = ?", [data.usuarioId]);
      }

      const perfil = {
        name: perfilRows[0].nome,
        defaults: typeof perfilRows[0].configuracoes_padrao === "string" 
          ? JSON.parse(perfilRows[0].configuracoes_padrao) 
          : perfilRows[0].configuracoes_padrao,
        goalSessionsPerWeek: perfilRows[0].meta_sessoes_semana,
        points: perfilRows[0].pontos,
        achievements: typeof perfilRows[0].conquistas === "string"
          ? JSON.parse(perfilRows[0].conquistas)
          : perfilRows[0].conquistas,
      };

      // Buscar roteiros do usuário
      const roteirosRows = await query<any[]>(
        "SELECT * FROM roteiros WHERE usuario_id = ? ORDER BY atualizado_em DESC", 
        [data.usuarioId]
      );
      const scripts = roteirosRows.map((r) => ({
        id: r.id,
        title: r.titulo,
        description: r.descricao || "",
        category: r.categoria,
        content: r.conteudo || "",
        settings: typeof r.configuracoes === "string" ? JSON.parse(r.configuracoes) : r.configuracoes,
        createdAt: r.criado_em.toISOString(),
        updatedAt: r.atualizado_em.toISOString(),
        lastUsedAt: r.ultimo_uso_em ? r.ultimo_uso_em.toISOString() : null,
        sessionsCount: r.total_sessoes,
      }));

      // Buscar sessões de treino do usuário
      const sessoesRows = await query<any[]>(
        "SELECT * FROM sessoes_treino WHERE usuario_id = ? ORDER BY iniciado_em DESC",
        [data.usuarioId]
      );
      const sessions = await Promise.all(
        sessoesRows.map(async (s) => {
          // Buscar feedbacks vinculados
          const feedbacksRows = await query<any[]>("SELECT tipo as kind, texto as text FROM feedbacks WHERE sessao_id = ?", [s.id]);
          return {
            id: s.id,
            scriptId: s.roteiro_id || "",
            scriptTitle: s.roteiro_titulo,
            level: s.nivel,
            startedAt: s.iniciado_em.toISOString(),
            metrics: typeof s.metricas === "string" ? JSON.parse(s.metricas) : s.metricas,
            feedback: feedbacksRows,
            notes: s.observacoes || "",
            recordingId: s.gravacao_id,
            recordingKind: s.gravacao_tipo,
          };
        })
      );

      return { perfil, scripts, sessions };
    } catch (error) {
      console.error("Erro ao obter dados iniciais do MySQL:", error);
      throw error;
    }
  });

export const salvarRoteiroDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      script: z.any(),
      usuarioId: z.string(),
    })
  )
  .handler(async ({ data: { script, usuarioId } }) => {
    try {
      const now = new Date();
      const criacao = script.createdAt ? new Date(script.createdAt) : now;
      const atualizacao = script.updatedAt ? new Date(script.updatedAt) : now;
      const ultimoUso = script.lastUsedAt ? new Date(script.lastUsedAt) : null;

      await query(
        `INSERT INTO roteiros (id, titulo, descricao, categoria, conteudo, configuracoes, criado_em, atualizado_em, ultimo_uso_em, total_sessoes, usuario_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           titulo = VALUES(titulo),
           descricao = VALUES(descricao),
           categoria = VALUES(categoria),
           conteudo = VALUES(conteudo),
           configuracoes = VALUES(configuracoes),
           atualizado_em = VALUES(atualizado_em),
           ultimo_uso_em = VALUES(ultimo_uso_em),
           total_sessoes = VALUES(total_sessoes),
           usuario_id = VALUES(usuario_id)`,
        [
          script.id,
          script.title,
          script.description,
          script.category,
          script.content,
          JSON.stringify(script.settings),
          criacao,
          atualizacao,
          ultimoUso,
          script.sessionsCount,
          usuarioId,
        ]
      );
      return { success: true };
    } catch (error) {
      console.error("Erro ao salvar roteiro no MySQL:", error);
      throw error;
    }
  });

export const excluirRoteiroDb = createServerFn({ method: "POST" })
  .validator(z.string())
  .handler(async ({ data: id }) => {
    try {
      await query("DELETE FROM roteiros WHERE id = ?", [id]);
      return { success: true };
    } catch (error) {
      console.error("Erro ao excluir roteiro no MySQL:", error);
      throw error;
    }
  });

export const salvarSessaoDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      session: z.any(),
      usuarioId: z.string(),
    })
  )
  .handler(async ({ data: { session, usuarioId } }) => {
    try {
      const iniciadoEm = session.startedAt ? new Date(session.startedAt) : new Date();
      await query(
        `INSERT INTO sessoes_treino (id, roteiro_id, roteiro_titulo, nivel, iniciado_em, metricas, observacoes, gravacao_id, gravacao_tipo, usuario_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           roteiro_id = VALUES(roteiro_id),
           roteiro_titulo = VALUES(roteiro_titulo),
           nivel = VALUES(nivel),
           metricas = VALUES(metricas),
           observacoes = VALUES(observacoes),
           gravacao_id = VALUES(gravacao_id),
           gravacao_tipo = VALUES(gravacao_tipo),
           usuario_id = VALUES(usuario_id)`,
        [
          session.id,
          session.scriptId || null,
          session.scriptTitle,
          session.level,
          iniciadoEm,
          JSON.stringify(session.metrics),
          session.notes,
          session.recordingId,
          session.recordingKind,
          usuarioId,
        ]
      );

      // Limpar feedbacks antigos da sessão
      await query("DELETE FROM feedbacks WHERE sessao_id = ?", [session.id]);

      // Inserir feedbacks
      if (session.feedback && session.feedback.length > 0) {
        for (const item of session.feedback) {
          await query(
            "INSERT INTO feedbacks (sessao_id, tipo, texto) VALUES (?, ?, ?)",
            [session.id, item.kind, item.text]
          );
        }
      }
      return { success: true };
    } catch (error) {
      console.error("Erro ao salvar sessão no MySQL:", error);
      throw error;
    }
  });

export const excluirSessaoDb = createServerFn({ method: "POST" })
  .validator(z.string())
  .handler(async ({ data: id }) => {
    try {
      await query("DELETE FROM sessoes_treino WHERE id = ?", [id]);
      return { success: true };
    } catch (error) {
      console.error("Erro ao excluir sessão no MySQL:", error);
      throw error;
    }
  });

export const salvarPerfilDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      perfil: z.any(),
      usuarioId: z.string(),
    })
  )
  .handler(async ({ data: { perfil, usuarioId } }) => {
    try {
      await query(
        `INSERT INTO perfil (id, nome, configuracoes_padrao, meta_sessoes_semana, pontos, conquistas)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           nome = VALUES(nome),
           configuracoes_padrao = VALUES(configuracoes_padrao),
           meta_sessoes_semana = VALUES(meta_sessoes_semana),
           pontos = VALUES(pontos),
           conquistas = VALUES(conquistas)`,
        [
          usuarioId,
          perfil.name,
          JSON.stringify(perfil.defaults),
          perfil.goalSessionsPerWeek,
          perfil.points,
          JSON.stringify(perfil.achievements),
        ]
      );
      return { success: true };
    } catch (error) {
      console.error("Erro ao salvar perfil no MySQL:", error);
      throw error;
    }
  });

export const analisarDiscursoIA = createServerFn({ method: "POST" })
  .validator(
    z.object({
      roteiroOriginal: z.string(),
      textoDito: z.string(),
      duracaoSegundos: z.number(),
      pausas: z.number(),
    })
  )
  .handler(async ({ data: dados }) => {
    try {
      const dotenv = await import("dotenv");
      dotenv.config();

      const apiKey = process.env["CHAVE_GEMINI"] || process.env["GEMINI_API_KEY"];

      if (!apiKey) {
        throw new Error("Chave do Gemini não configurada no arquivo .env.");
      }

      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

      const prompt = `Você é um avaliador de oratória profissional. Analise o treino de oratória do usuário.
Roteiro original:
"""
${dados.roteiroOriginal}
"""

Texto realmente dito pelo usuário:
"""
${dados.textoDito}
"""

Métricas coletadas:
- Duração: ${dados.duracaoSegundos} segundos
- Pausas identificadas: ${dados.pausas}

Com base nestes dados, identifique pontos fortes, pontos de melhoria e recomendações.
O seu feedback deve ser devolvido estritamente em formato JSON estruturado seguindo este schema:
[
  { "kind": "forte", "text": "descrição do ponto forte observado" },
  { "kind": "melhoria", "text": "descrição do ponto que precisa de atenção" },
  { "kind": "recomendacao", "text": "dica prática e acionável para o próximo treino" }
]
Você pode adicionar até 3 ou 4 itens em cada categoria se achar relevante. Responda apenas com o JSON bruto, sem blocos de código markdown adicionais.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      
      // Limpar blocos de código se o modelo teimar em retornar markdown ```json
      const cleanJson = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error("Erro na geração de feedback do Gemini:", error);
      // Retornar um fallback amigável caso ocorra erro
      return [
        { kind: "forte", text: "Você conseguiu completar a apresentação." },
        { kind: "melhoria", "text": "Não foi possível realizar a análise avançada com a IA neste momento." },
        { kind: "recomendacao", text: "Verifique sua conexão e a chave de API do Gemini." }
      ];
    }
  });

export const enviarComandoRemoto = createServerFn({ method: "POST" })
  .validator(
    z.object({
      scriptId: z.string(),
      comando: z.string(),
    })
  )
  .handler(async ({ data }) => {
    try {
      const timestamp = Date.now();
      await query(
        `INSERT INTO controles_remotos (roteiro_id, comando, timestamp)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE comando = VALUES(comando), timestamp = VALUES(timestamp)`,
        [data.scriptId, data.comando, timestamp]
      );
      return { success: true };
    } catch (error) {
      console.error("Erro ao enviar comando remoto:", error);
      throw error;
    }
  });

export const obterComandoRemoto = createServerFn({ method: "POST" })
  .validator(
    z.object({
      scriptId: z.string(),
    })
  )
  .handler(async ({ data }) => {
    try {
      const rows = await query<any[]>("SELECT * FROM controles_remotos WHERE roteiro_id = ?", [data.scriptId]);
      if (rows.length > 0) {
        return { comando: rows[0].comando, timestamp: rows[0].timestamp };
      }
      return null;
    } catch (error) {
      console.error("Erro ao obter comando remoto:", error);
      throw error;
    }
  });

export const obterChaveGemini = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const dotenv = await import("dotenv");
      dotenv.config();
      return process.env["CHAVE_GEMINI"] || process.env["GEMINI_API_KEY"] || "";
    } catch {
      return "";
    }
  });

export const salvarChaveGemini = createServerFn({ method: "POST" })
  .validator(z.string())
  .handler(async ({ data: chave }) => {
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const envPath = path.resolve(process.cwd(), ".env");
      let content = "";
      try {
        content = await fs.readFile(envPath, "utf-8");
      } catch {
        // Se não existir, cria vazio
      }

      if (content.includes("GEMINI_API_KEY=")) {
        content = content.replace(/GEMINI_API_KEY=.*/, `GEMINI_API_KEY=${chave}`);
      } else {
        content += `\nGEMINI_API_KEY=${chave}`;
      }

      await fs.writeFile(envPath, content.trim() + "\n", "utf-8");
      process.env["GEMINI_API_KEY"] = chave;
      return { success: true };
    } catch (error) {
      console.error("Erro ao salvar chave do Gemini no .env:", error);
      throw error;
    }
  });

export const listarUsuarios = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const rows = await query<any[]>(
        `SELECT 
           u.id, 
           u.nome, 
           u.email, 
           u.criado_em,
           (SELECT COUNT(*) FROM roteiros r WHERE r.usuario_id = u.id) as total_roteiros,
           (SELECT COUNT(*) FROM sessoes_treino s WHERE s.usuario_id = u.id) as total_treinos
         FROM usuarios u
         ORDER BY u.criado_em DESC`
      );
      return rows.map((r) => ({
        id: r.id,
        nome: r.nome,
        email: r.email,
        criadoEm: r.criado_em.toISOString(),
        totalRoteiros: r.total_roteiros,
        totalTreinos: r.total_treinos,
      }));
    } catch (error) {
      console.error("Erro ao listar usuários do MySQL:", error);
      throw error;
    }
  });

export const excluirUsuarioDb = createServerFn({ method: "POST" })
  .validator(z.string())
  .handler(async ({ data: id }) => {
    try {
      // Exclusão sequencial explícita para evitar problemas de Foreign Key
      await query("DELETE FROM sessoes_treino WHERE usuario_id = ?", [id]);
      await query("DELETE FROM roteiros WHERE usuario_id = ?", [id]);
      await query("DELETE FROM perfil WHERE id = ?", [id]);
      await query("DELETE FROM usuarios WHERE id = ?", [id]);
      return { success: true };
    } catch (error) {
      console.error("Erro ao excluir usuário do MySQL:", error);
      throw error;
    }
  });
