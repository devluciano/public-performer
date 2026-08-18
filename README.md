# Eloquence Pro

Crie um aplicativo web responsivo de Teleprompter para Treino de Oratória, com interface moderna, profissional, minimalista e otimizada para leitura durante apresentações, discursos, aulas, reuniões, vídeos e treinamentos.

O objetivo principal do aplicativo é permitir que o usuário escreva ou importe um roteiro e pratique sua apresentação utilizando um teleprompter, enquanto acompanha métricas de desempenho relacionadas à fala, ritmo, tempo e evolução.

1. Tela principal

Criar um dashboard contendo:

Novo treino

Meus roteiros

Histórico de treinos

Estatísticas de desempenho

Configurações

Exibir também um resumo do último treino:

Tempo de fala

Quantidade de palavras

Velocidade média de fala

Número de pausas

Progresso de evolução

Última sessão realizada

2. Editor de roteiro

Criar um editor de texto rico para elaboração dos discursos.

Funcionalidades:

Criar roteiro

Editar roteiro

Salvar automaticamente

Renomear roteiro

Duplicar roteiro

Excluir roteiro

Importar arquivo .txt, .docx e .pdf

Exportar roteiro

Contador de palavras

Estimativa de duração da apresentação

Divisão do roteiro em seções

Destaque de palavras importantes

Inserção de marcações para pausa

Inserção de indicações como [PAUSA], [ÊNFASE], [RESPIRAR], [OLHAR PARA A PLATEIA]

Exibir uma estimativa de duração baseada na quantidade de palavras e na velocidade de fala configurada.

3. Modo Teleprompter

Criar uma tela exclusiva de apresentação, ocupando praticamente toda a área disponível.

O texto deve:

Rolar verticalmente de forma automática

Possuir velocidade configurável

Permitir aumentar ou diminuir o tamanho da fonte

Permitir alterar espaçamento entre linhas

Permitir alterar largura da área de leitura

Permitir alterar contraste

Permitir modo claro e escuro

Permitir espelhamento horizontal para uso com equipamentos de teleprompter

Permitir alinhamento centralizado ou à esquerda

Manter uma área visual de leitura fixa no centro da tela

Destacar visualmente a linha atualmente sendo lida

Controles do teleprompter:

Iniciar

Pausar

Continuar

Reiniciar

Aumentar velocidade

Diminuir velocidade

Aumentar fonte

Diminuir fonte

Tela cheia

Espelhar

Voltar ao roteiro

Permitir também controle por teclado:

Espaço: iniciar/pausar

Setas para cima/baixo: ajustar velocidade

+ / -: alterar tamanho da fonte

R: reiniciar

F: tela cheia

M: ativar/desativar espelhamento

4. Controle de velocidade

Criar um controle de velocidade intuitivo.

Permitir configurar a velocidade do teleprompter, por exemplo:

Muito lento

Lento

Normal

Rápido

Muito rápido

Também permitir ajuste manual preciso.

Exibir a velocidade atual na interface.

A velocidade deve ser salva individualmente para cada roteiro.

5. Cronômetro

Durante o treino, exibir:

Tempo decorrido

Tempo estimado restante

Tempo total estimado

Progresso do roteiro em percentual

Criar uma barra de progresso visual.

6. Treino de oratória

Adicionar um modo específico chamado "Modo Treino".

Nesse modo, o aplicativo deve ajudar o usuário a desenvolver:

Clareza

Ritmo

Controle do tempo

Fluidez

Uso de pausas

Segurança na apresentação

Capacidade de improvisação

Permitir iniciar o treino sem mostrar o texto completo, exibindo apenas palavras-chave ou tópicos.

Criar três níveis:

Iniciante — roteiro completo disponível.

Intermediário — roteiro parcialmente oculto e palavras-chave destacadas.

Avançado — somente tópicos e palavras-chave.

7. Gravação da apresentação

Adicionar opção para gravar áudio e/ou vídeo durante o treino.

Permitir:

Iniciar gravação

Pausar gravação

Finalizar gravação

Reproduzir gravação

Excluir gravação

Salvar gravação vinculada ao treino

Após a gravação, apresentar uma análise da sessão.

8. Métricas de desempenho

Criar uma tela de análise contendo:

Duração total

Quantidade de palavras faladas

Palavras por minuto (WPM)

Velocidade média

Número de pausas

Duração média das pausas

Tempo de fala contínua

Variação do ritmo

Progresso em relação aos treinos anteriores

Criar gráficos para mostrar a evolução do usuário ao longo do tempo.

Exemplo:

Velocidade de fala

120 WPM → 125 WPM → 118 WPM → 122 WPM

Tempo de apresentação

08:32 → 08:10 → 07:58 → 07:45

9. Feedback inteligente

Adicionar uma funcionalidade de análise por IA.

Após o treino, gerar feedback sobre:

Clareza da fala

Ritmo

Repetições excessivas

Palavras de preenchimento

Pausas inadequadas

Trechos muito rápidos

Trechos muito lentos

Estrutura do discurso

Pontos fortes

Pontos que precisam ser melhorados

Apresentar o feedback de maneira objetiva, por exemplo:

Ponto forte
"Você manteve um ritmo consistente durante a maior parte da apresentação."

Ponto de melhoria
"Foi identificado aumento significativo da velocidade no segundo bloco do discurso."

Recomendação
"Faça uma pausa de 1–2 segundos após frases conclusivas."

10. Biblioteca de roteiros

Criar uma área para gerenciamento dos roteiros.

Cada roteiro deve apresentar:

Título

Descrição

Categoria

Quantidade de palavras

Duração estimada

Última utilização

Quantidade de treinos

Melhor desempenho

Permitir filtros por:

Nome

Categoria

Data

Mais utilizados

Recentes

Categorias sugeridas:

Apresentação

Reunião

Aula

Pitch

Entrevista

Vídeo

Discurso

Treinamento

Outros

11. Histórico

Criar uma timeline dos treinamentos.

Cada sessão deve registrar:

Data

Roteiro utilizado

Duração

WPM

Pontuação

Observações

Gravação

Permitir comparar duas sessões para identificar evolução.

12. Gamificação

Adicionar sistema opcional de evolução.

Criar:

Pontuação

Níveis

Metas

Sequência de treinos

Conquistas

Exemplos:

Primeiro treino

10 treinos concluídos

7 dias consecutivos

1000 palavras praticadas

Ritmo consistente

Apresentação concluída sem interrupções

13. Interface

Utilizar uma interface moderna de SaaS, com:

Design minimalista

Excelente hierarquia visual

Tipografia legível

Componentes reutilizáveis

Responsividade

Desktop, tablet e mobile

Navegação lateral no desktop

Navegação adaptada para dispositivos móveis

O modo Teleprompter deve priorizar legibilidade e ausência de distrações.

No modo de apresentação, ocultar elementos desnecessários e deixar o texto como elemento principal da interface.

14. Arquitetura

Estruturar o projeto utilizando uma arquitetura modular e escalável.

Separar claramente:

Interface

Componentes

Estado da aplicação

Domínio

Serviços

Persistência

Autenticação

Integrações de IA

Processamento de áudio

Processamento de métricas

Criar componentes reutilizáveis para:

Editor

Teleprompter

Cronômetro

Controle de velocidade

Gráficos

Métricas

Player de gravação

Dashboard

Biblioteca de roteiros

15. Persistência

Criar estrutura de dados para:

Usuários

Roteiros

Sessões de treino

Métricas

Gravações

Configurações

Metas

Conquistas

O sistema deve salvar automaticamente o progresso do usuário.

16. Experiência do usuário

O fluxo principal deve ser extremamente simples:

Criar roteiro → Configurar teleprompter → Iniciar treino → Apresentar → Finalizar → Analisar desempenho → Acompanhar evolução

Evitar excesso de configurações na tela principal.

As configurações avançadas devem ficar disponíveis em um painel separado.

17. Requisitos técnicos

Desenvolver o aplicativo seguindo boas práticas de engenharia de software.

Utilizar:

Componentização

Tipagem forte

Validação de dados

Tratamento de erros

Estados de loading, sucesso e erro

Persistência segura

Código limpo e manutenível

Responsividade

Acessibilidade

Performance otimizada

Criar uma estrutura preparada para futura integração com:

APIs de IA

Speech-to-Text

Text-to-Speech

Análise de áudio

Análise de vídeo

Autenticação social

Sincronização em nuvem

Aplicativo mobile

18. Resultado esperado

Entregar um aplicativo funcional de teleprompter focado em treinamento de oratória, e não apenas um simples leitor de textos.

O produto deve combinar:

Teleprompter + Editor de Roteiros + Cronômetro + Gravação + Métricas + Feedback por IA + Histórico de Evolução + Gamificação.

Priorizar inicialmente um MVP funcional, com excelente experiência no modo Teleprompter, e deixar a arquitetura preparada para evolução posterior.

Antes de implementar, organize o projeto, defina os principais componentes, modelos de dados, fluxos de usuário e arquitetura. Em seguida, implemente as funcionalidades de forma incremental, mantendo o código modular e preparado para produção.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://public-performer.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2854a0b8-1232-48f0-b64a-3aad5bfb5a5f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
