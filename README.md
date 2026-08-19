# 🎙️ Eloquence Pro

> **Eloquence Pro** é um aplicativo web de Teleprompter inteligente voltado para o treino de oratória. Conta com uma interface moderna, profissional, minimalista e altamente otimizada para leitura durante apresentações, discursos, aulas, reuniões, vídeos e treinamentos.

O objetivo principal do aplicativo é permitir que o usuário escreva ou importe um roteiro e pratique sua apresentação utilizando um teleprompter interativo, acompanhando métricas detalhadas de desempenho (ritmo, tempo, pausas e evolução da fala).

---

## 🚀 Principais Funcionalidades

### 1. 📊 Painel Principal (Dashboard)
Painel centralizado contendo atalhos rápidos para o fluxo de trabalho e o resumo da última performance:
*   **Ações Rápidas**: Iniciar novo treino, gerenciar roteiros, visualizar histórico de treinos e métricas de desempenho.
*   **Resumo do Último Treino**:
    *   ⏱️ Tempo total de fala
    *   📝 Quantidade de palavras
    *   ⚡ Velocidade média de fala (WPM - Palavras por Minuto)
    *   ⏸️ Número de pausas identificadas
    *   📈 Gráfico de progresso e data da última sessão realizada

### 2. 📝 Editor de Roteiros
Editor rico para elaboração e formatação dos discursos:
*   **Gerenciamento**: Criação, edição, salvamento automático, renomeação, duplicação e exclusão de roteiros.
*   **Importação & Exportação**: Suporte para arquivos `.txt`, `.docx` e `.pdf`.
*   **Métricas de Texto**: Contador de palavras e estimativa inteligente de duração da apresentação com base no WPM configurado.
*   **Direcionamentos Visuais**:
    *   Divisão do roteiro em seções.
    *   Destaque de termos importantes.
    *   Inserção de tags de comportamento/direção: `[PAUSA]`, `[ÊNFASE]`, `[RESPIRAR]`, `[OLHAR PARA A PLATEIA]`.

### 3. 🖥️ Modo Teleprompter Profissional
Interface imersiva em tela cheia projetada para evitar qualquer tipo de distração:
*   **Rolagem Automatizada**: Movimento vertical suave com velocidade totalmente configurável.
*   **Customização Visual**:
    *   Ajuste do tamanho da fonte e espaçamento entre linhas.
    *   Ajuste da largura da área de leitura.
    *   Alternância de contraste e suporte completo a **Modo Claro / Escuro**.
    *   **Espelhamento Horizontal** para uso integrado com hardware de teleprompter físico.
    *   Alinhamento de texto (centralizado ou esquerda).
    *   Destaque visual na linha de leitura corrente (foco dinâmico).
*   **Atalhos de Teclado**:
    *   `Espaço`: Iniciar / Pausar
    *   `Setas Cima / Baixo`: Ajustar velocidade de rolagem
    *   `+` / `-`: Alterar tamanho da fonte
    *   `R`: Reiniciar
    *   `F`: Tela cheia
    *   `M`: Ativar / Desativar espelhamento

### 4. 🎚️ Controle de Velocidade Dinâmico
*   Ajustes rápidos e intuitivos por níveis predefinidos (*Muito lento*, *Lento*, *Normal*, *Rápido*, *Muito rápido*).
*   Ajuste manual preciso e exibição da velocidade ativa na tela.
*   A velocidade configurada é salva individualmente por roteiro.

### 5. ⏱️ Cronômetro Integrado
Monitoramento em tempo real do treino:
*   Tempo decorrido e tempo estimado restante.
*   Barra de progresso visual mostrando a porcentagem concluída do roteiro.

### 6. 🎓 Níveis de Treino de Oratória
Modulação de ajuda conforme a experiência e autoconfiança do usuário:
*   🟢 **Iniciante**: Exibe o roteiro completo no teleprompter.
*   🟡 **Intermediário**: Roteiro parcialmente oculto, destacando apenas as palavras-chave.
*   🔴 **Avançado**: Exibe exclusivamente tópicos e palavras-chave para estimular a improvisação e a naturalidade.

### 7. 📹 Gravação de Apresentação
*   Gravação integrada de áudio e/ou vídeo durante a leitura.
*   Opções de *Iniciar*, *Pausar*, *Finalizar*, *Reproduzir* e *Excluir* gravações.
*   Armazenamento das gravações vinculado ao histórico da sessão de treino.

### 8. 📉 Métricas e Análise de Desempenho
Estatísticas avançadas ao final de cada sessão:
*   Palavras por minuto (WPM) e variação do ritmo de fala.
*   Quantidade de pausas e duração média do silêncio.
*   Gráficos históricos para acompanhamento da evolução ao longo do tempo (ex: evolução de WPM e redução do tempo total).

### 9. 🤖 Feedback Inteligente por IA
Análise automatizada sobre a qualidade do discurso:
*   Detecção de palavras de preenchimento (vícios de linguagem).
*   Identificação de picos de velocidade inapropriados ou pausas excessivas.
*   Dicas práticas personalizadas (Ex: *"Faça uma pausa de 1-2 segundos após frases conclusivas"*).

### 10. 🏆 Gamificação e Evolução (Opcional)
*   Sistema de pontuação e níveis.
*   Metas diárias/semanais e streaks (sequência de treinos em dias consecutivos).
*   Conquistas desbloqueáveis (ex: *"Primeiro treino"*, *"1000 palavras praticadas"*, *"Ritmo consistente"*).

---

## 🛠️ Arquitetura e Engenharia

O projeto foi estruturado seguindo os melhores padrões de desenvolvimento modernos, mantendo uma clara separação de conceitos:

```
src/
├── components/     # Componentes de UI reutilizáveis (Teleprompter, Editor, Dashboard, etc.)
├── domain/         # Regras de negócio puras (Métricas, cálculos de tempo, WPM)
├── services/       # Integrações externas (Persistência, Gravação, IA)
└── state/          # Gerenciamento de estado da aplicação
```

---

## 💻 Desenvolvimento Local

O Eloquence Pro foi construído utilizando tecnologias modernas voltadas para performance e excelente experiência de desenvolvimento.

### Pré-requisitos
*   [Node.js](https://nodejs.org/) (Versão LTS recomendada)
*   [MySQL](https://www.mysql.com/) (Servidor rodando localmente)
*   Gerenciador de pacotes `npm`

### Executando o Projeto

1. **Clone o repositório:**
   ```sh
   git clone <url-do-repositorio>
   cd public-performer
   ```

2. **Configure as Variáveis de Ambiente:**
   Copie o arquivo de exemplo para o seu arquivo local de ambiente:
   ```sh
   cp .env.example .env
   ```
   Abra o arquivo `.env` gerado e configure suas credenciais do banco de dados MySQL e a sua chave de API do Gemini em `CHAVE_GEMINI`.

3. **Configure o Banco de Dados:**
   Importe a estrutura do banco de dados MySQL contida no arquivo [`schema.sql`](file:///c:/projetos/public-performer/schema.sql) utilizando o console do MySQL ou seu cliente de preferência (ex: DBeaver, MySQL Workbench):
   ```sh
   mysql -u seu_usuario -p < schema.sql
   ```

4. **Instale as dependências:**
   ```sh
   npm install
   ```

5. **Inicie o servidor de desenvolvimento:**
   ```sh
   npm run dev
   ```

---

### ✍️ Autor
Desenvolvido por **Luciano Silva** — *FullStack Developer* na **LeanCode Sistemas**.

