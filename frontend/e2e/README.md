# Testes de ponta a ponta (Playwright)

Testam o sistema como o usuário usa: navegador de verdade, API de verdade e banco (emulador) de verdade.

## Como rodar

Na pasta `frontend`:

| Comando | O que roda |
|---------|------------|
| `npm run e2e` | Todos os testes de computador (projeto `regressao`) |
| `npm run e2e:smoke` | Só os críticos (tag `@smoke`): acesso, criar etapa e Dupla Fixa completa |
| `npm run e2e:celular` | Testes em tela de celular (`*.celular.spec.ts`) |
| `npm run e2e -- jogadores` | Só os arquivos com "jogadores" no nome |
| `npm run e2e -- --grep @p1` | Só os marcados como P1 |
| `npm run e2e -- --ui` | Modo visual: ver cada passo, repetir, depurar |
| `npm run e2e:relatorio` | Abre o relatório da última execução |

Precisa de: firebase-tools, Java e Chrome instalado (não baixa navegador). Leva cerca de 1 minuto.

## Como funciona

1. O Playwright sobe um **ambiente só dos testes** (`scripts/demo`, `DEMO_AMBIENTE=e2e`): emulador próprio (projeto `demo-e2e`, portas 28080/29099), API (25100) e front (23100). Não encosta no emulador do dia a dia nem em staging; pode rodar com eles ligados.
2. `dados.setup.ts` apaga esse emulador e cria a **Arena Demo** pela API (`scripts/demo/semear.mjs`): 48 jogadores e uma etapa em cada situação.
3. `login.setup.ts` entra como admin uma vez; a sessão (`e2e/.auth`) é reaproveitada pelos testes.
4. Os testes rodam em paralelo.

## Estrutura

```
e2e/
  apoio/
    fixtures.ts   test com `api` (cliente da API logado) e `demo` (ids da Arena Demo)
    telas.ts      ações repetidas (criar etapa, abrir chaves, confirmar, placar)
    sessao.ts     caminho da sessão e sessão vazia (páginas sem login)
  testes/
    *.setup.ts           preparação (dados e login)
    <area>.spec.ts       um arquivo por área; prioridade pela tag:
                         @smoke (críticos), @p1 (importantes), sem tag (desejáveis)
    *.celular.spec.ts    tela de celular
  plans/                 planos de teste escritos (casos, passos, resultado esperado)
```

| Arquivo | Cobre |
|---------|-------|
| `acesso` | Login, senha errada, rota protegida, sair |
| `jogadores` | Cadastrar, nome obrigatório, nome repetido, editar, limpar campo, excluir, buscar e filtrar |
| `criar-etapa` | Criar etapa dos 4 formatos; datas e nome obrigatório; regras do formulário de cada formato (chaveamento do Rei da Praia, variante e pontos do Super X, múltiplo de 6 no Teams 6) |
| `inscricoes` | Inscrever, gênero da etapa, cadastrar no modal, cancelar, encerrar inscrições |
| `dupla-fixa` | Gerar chaves, resultados do grupo, gerar eliminatória, resultado de confronto, encerrar |
| `rei-da-praia` | Chaves, resultados individuais, eliminatória com chaveamento, encerrar |
| `super-x` | Chaves em grupo único, resultados por rodada, encerrar sem eliminatória |
| `teams` | Gerar equipes, resultado do confronto, escalação manual, renomear equipe, encerrar |
| `etapa-acoes` | Empate por sorteio, substituir jogador, cabeças de chave, duplas e equipes manuais, cancelar eliminatória, apagar chaves |
| `publico` | Página da arena, ranking, etapa pública, perfil (sem telefone), arena inexistente |
| `resultados.celular` | Resultados pelo celular, menu do admin, página pública sem rolagem lateral |

## Regras para escrever teste

- **Preparar pela API, testar pela tela.** O cenário (etapa com chaves, resultados...) é montado com `api` e os ajudantes de `scripts/demo/dados.mjs`; só o passo que o teste verifica é feito na tela.
- **Teste que altera dados cria a própria etapa** com `nomeUnico(...)`. As etapas da Arena Demo (`demo.etapas`) são só para leitura: vários testes as usam ao mesmo tempo.
- **Localizar como o usuário enxerga:** `getByRole` com o nome (botão, campo, tabela, aba). Nada de classe CSS. Rótulos com `*` (obrigatório): use expressão, ex. `{ name: /^Nome da Etapa/ }`.
- **Esperar pelo que aparece, nunca por tempo:** `await expect(...).toBeVisible()`, `toHaveCount(n)`. Antes de contar itens de um modal, espere a quantidade (`toHaveCount`), porque `count()` não espera.
- **Um teste, um motivo para falhar.** Nome do teste diz o comportamento ("lança os resultados de um grupo e atualiza a classificação").
- **Teste falhou?** Veja `e2e/relatorio` (print, vídeo do passo a passo e a árvore da tela). Se for o app que mudou de comportamento, é bug: não ajuste o teste para passar.

## Achados abertos

| Achado | Teste que mostra |
|--------|------------------|
| Lista de jogadores mostra resultado errado na busca: respostas antigas chegam depois e sobrescrevem a nova (`useListagemJogadores` não descarta resposta velha). Falha às vezes | `jogadores` › "filtra a lista pelo nome" e "cadastra jogador..." |
| Botão do menu no celular tem só "☰" como nome (leitor de tela não diz o que é) | `resultados.celular` › "navega pelo menu do admin" |
| Super X mostra a opção "aplicar melhor de 3 na eliminatória", mas não tem eliminatória (decisão pendente) | `criar-etapa` › "melhor de 3 revela a opção da eliminatória" |
