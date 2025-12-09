/**
 * Dados de teste tipados usando os models reais
 *
 * IMPORTANTE: Todos os fixtures usam os tipos reais importados dos models.
 */

import { createMockTimestamp, timestampFuture } from "../types/firebase-mock";

// ========== IMPORTS DOS MODELS REAIS ==========
import {
  Jogador,
  NivelJogador,
  StatusJogador,
  GeneroJogador,
  CriarJogadorDTO,
} from "../../models/Jogador";

import {
  Etapa,
  StatusEtapa,
  FaseEtapa,
  FormatoEtapa,
  CriarEtapaDTO,
} from "../../models/Etapa";

import { Inscricao, StatusInscricao } from "../../models/Inscricao";

import { Dupla } from "../../models/Dupla";

import { Grupo } from "../../models/Grupo";

import { Partida, StatusPartida } from "../../models/Partida";

import { EstatisticasJogador } from "../../models/EstatisticasJogador";

import {
  ConfrontoEliminatorio,
  TipoFase,
  StatusConfrontoEliminatorio,
} from "../../models/Eliminatoria";

// ========== IDs CONSTANTES PARA TESTES ==========
export const TEST_IDS = {
  arena: "arena-test-001",
  admin: "admin-test-001",
  jogador1: "jogador-test-001",
  jogador2: "jogador-test-002",
  jogador3: "jogador-test-003",
  jogador4: "jogador-test-004",
  etapa: "etapa-test-001",
  inscricao1: "inscricao-test-001",
  inscricao2: "inscricao-test-002",
  dupla1: "dupla-test-001",
  dupla2: "dupla-test-002",
  grupo1: "grupo-test-001",
  grupo2: "grupo-test-002",
  partida1: "partida-test-001",
  partida2: "partida-test-002",
  confronto1: "confronto-test-001",
};

// ========== FIXTURES DE JOGADOR ==========

/**
 * Jogador completo para testes
 */
export function createJogadorFixture(
  overrides: Partial<Jogador> = {}
): Jogador {
  const now = createMockTimestamp();

  return {
    id: TEST_IDS.jogador1,
    arenaId: TEST_IDS.arena,
    nome: "João Silva",
    email: "joao@teste.com",
    telefone: "11999999999",
    dataNascimento: "1990-01-15",
    genero: GeneroJogador.MASCULINO,
    nivel: NivelJogador.INTERMEDIARIO,
    status: StatusJogador.ATIVO,
    observacoes: "",
    vitorias: 0,
    derrotas: 0,
    pontos: 0,
    criadoEm: now,
    atualizadoEm: now,
    criadoPor: TEST_IDS.admin,
    ...overrides,
  };
}

/**
 * DTO para criar jogador
 */
export function createCriarJogadorDTO(
  overrides: Partial<CriarJogadorDTO> = {}
): CriarJogadorDTO {
  return {
    nome: "João Silva",
    email: "joao@teste.com",
    telefone: "11999999999",
    dataNascimento: "1990-01-15",
    genero: GeneroJogador.MASCULINO,
    nivel: NivelJogador.INTERMEDIARIO,
    status: StatusJogador.ATIVO,
    observacoes: "",
    ...overrides,
  };
}

/**
 * Lista de jogadores para testes de listagem
 */
export function createJogadoresFixture(count = 4): Jogador[] {
  const nomes = ["João Silva", "Maria Santos", "Pedro Oliveira", "Ana Costa"];
  const generos = [
    GeneroJogador.MASCULINO,
    GeneroJogador.FEMININO,
    GeneroJogador.MASCULINO,
    GeneroJogador.FEMININO,
  ];

  return Array.from({ length: count }, (_, i) =>
    createJogadorFixture({
      id: `jogador-test-00${i + 1}`,
      nome: nomes[i % nomes.length],
      genero: generos[i % generos.length],
      email: `jogador${i + 1}@teste.com`,
    })
  );
}

// ========== FIXTURES DE ETAPA ==========

/**
 * Etapa completa para testes
 */
export function createEtapaFixture(overrides: Partial<Etapa> = {}): Etapa {
  const now = createMockTimestamp();
  const dataInicio = timestampFuture(7);
  const dataFim = timestampFuture(14);
  const dataRealizacao = timestampFuture(21);

  return {
    id: TEST_IDS.etapa,
    arenaId: TEST_IDS.arena,
    nome: "Etapa 1 - Dezembro 2025",
    descricao: "Primeira etapa do torneio",
    nivel: NivelJogador.INTERMEDIARIO,
    genero: GeneroJogador.MASCULINO,
    formato: FormatoEtapa.DUPLA_FIXA,
    tipoChaveamento: undefined,
    dataInicio,
    dataFim,
    dataRealizacao,
    local: "Arena Beach Tennis",
    maxJogadores: 16,
    jogadoresPorGrupo: 4,
    qtdGrupos: 4,
    status: StatusEtapa.INSCRICOES_ABERTAS,
    faseAtual: FaseEtapa.GRUPOS,
    totalInscritos: 0,
    jogadoresInscritos: [],
    chavesGeradas: false,
    dataGeracaoChaves: undefined,
    campeaoId: undefined,
    campeaoNome: undefined,
    contaPontosRanking: true,
    criadoEm: now,
    atualizadoEm: now,
    criadoPor: TEST_IDS.admin,
    finalizadoEm: undefined,
    ...overrides,
  };
}

/**
 * DTO para criar etapa
 */
export function createCriarEtapaDTO(
  overrides: Partial<CriarEtapaDTO> = {}
): CriarEtapaDTO {
  const dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() + 7);

  const dataFim = new Date();
  dataFim.setDate(dataFim.getDate() + 14);

  const dataRealizacao = new Date();
  dataRealizacao.setDate(dataRealizacao.getDate() + 21);

  return {
    nome: "Etapa 1 - Dezembro 2025",
    descricao: "Primeira etapa do torneio",
    nivel: NivelJogador.INTERMEDIARIO,
    genero: GeneroJogador.MASCULINO,
    formato: FormatoEtapa.DUPLA_FIXA,
    dataInicio: dataInicio.toISOString(),
    dataFim: dataFim.toISOString(),
    dataRealizacao: dataRealizacao.toISOString(),
    local: "Arena Beach Tennis",
    maxJogadores: 16,
    jogadoresPorGrupo: 4,
    contaPontosRanking: true,
    ...overrides,
  };
}

// ========== FIXTURES DE INSCRIÇÃO ==========

/**
 * Inscrição completa para testes
 */
export function createInscricaoFixture(
  overrides: Partial<Inscricao> = {}
): Inscricao {
  const now = createMockTimestamp();

  return {
    id: TEST_IDS.inscricao1,
    etapaId: TEST_IDS.etapa,
    arenaId: TEST_IDS.arena,
    jogadorId: TEST_IDS.jogador1,
    jogadorNome: "João Silva",
    jogadorNivel: NivelJogador.INTERMEDIARIO,
    jogadorGenero: GeneroJogador.MASCULINO,
    status: StatusInscricao.CONFIRMADA,
    duplaId: undefined,
    parceiroId: undefined,
    parceiroNome: undefined,
    grupoId: undefined,
    grupoNome: undefined,
    criadoEm: now,
    atualizadoEm: now,
    canceladoEm: undefined,
    ...overrides,
  };
}

// ========== FIXTURES DE DUPLA ==========

/**
 * Dupla completa para testes
 */
export function createDuplaFixture(overrides: Partial<Dupla> = {}): Dupla {
  const now = createMockTimestamp();

  return {
    id: TEST_IDS.dupla1,
    etapaId: TEST_IDS.etapa,
    arenaId: TEST_IDS.arena,
    jogador1Id: TEST_IDS.jogador1,
    jogador1Nome: "João Silva",
    jogador1Nivel: NivelJogador.INTERMEDIARIO,
    jogador1Genero: GeneroJogador.MASCULINO,
    jogador2Id: TEST_IDS.jogador2,
    jogador2Nome: "Pedro Oliveira",
    jogador2Nivel: NivelJogador.INTERMEDIARIO,
    jogador2Genero: GeneroJogador.MASCULINO,
    grupoId: TEST_IDS.grupo1,
    grupoNome: "Grupo A",
    jogos: 0,
    vitorias: 0,
    derrotas: 0,
    pontos: 0,
    setsVencidos: 0,
    setsPerdidos: 0,
    gamesVencidos: 0,
    gamesPerdidos: 0,
    saldoSets: 0,
    saldoGames: 0,
    posicaoGrupo: undefined,
    classificada: false,
    criadoEm: now,
    atualizadoEm: now,
    ...overrides,
  };
}

// ========== FIXTURES DE GRUPO ==========

/**
 * Grupo completo para testes
 */
export function createGrupoFixture(overrides: Partial<Grupo> = {}): Grupo {
  const now = createMockTimestamp();

  return {
    id: TEST_IDS.grupo1,
    etapaId: TEST_IDS.etapa,
    arenaId: TEST_IDS.arena,
    nome: "Grupo A",
    ordem: 1,
    duplas: [],
    totalDuplas: 0,
    partidas: [],
    totalPartidas: 0,
    partidasFinalizadas: 0,
    completo: false,
    classificadas: [],
    criadoEm: now,
    atualizadoEm: now,
    ...overrides,
  };
}

// ========== FIXTURES DE PARTIDA ==========

/**
 * Partida completa para testes
 */
export function createPartidaFixture(
  overrides: Partial<Partida> = {}
): Partida {
  const now = createMockTimestamp();

  return {
    id: TEST_IDS.partida1,
    etapaId: TEST_IDS.etapa,
    arenaId: TEST_IDS.arena,
    tipo: "grupos",
    fase: FaseEtapa.GRUPOS,
    grupoId: TEST_IDS.grupo1,
    grupoNome: "Grupo A",
    dupla1Id: TEST_IDS.dupla1,
    dupla1Nome: "João & Pedro",
    dupla2Id: TEST_IDS.dupla2,
    dupla2Nome: "Maria & Ana",
    dataHora: undefined,
    quadra: undefined,
    status: StatusPartida.AGENDADA,
    setsDupla1: 0,
    setsDupla2: 0,
    placar: undefined,
    vencedoraId: undefined,
    vencedoraNome: undefined,
    criadoEm: now,
    atualizadoEm: now,
    finalizadoEm: undefined,
    ...overrides,
  };
}

/**
 * Partida finalizada para testes
 */
export function createPartidaFinalizadaFixture(
  overrides: Partial<Partida> = {}
): Partida {
  const now = createMockTimestamp();

  return createPartidaFixture({
    status: StatusPartida.FINALIZADA,
    setsDupla1: 2,
    setsDupla2: 0,
    placar: [
      {
        numero: 1,
        gamesDupla1: 6,
        gamesDupla2: 4,
        vencedorId: TEST_IDS.dupla1,
      },
      {
        numero: 2,
        gamesDupla1: 6,
        gamesDupla2: 3,
        vencedorId: TEST_IDS.dupla1,
      },
    ],
    vencedoraId: TEST_IDS.dupla1,
    vencedoraNome: "João & Pedro",
    finalizadoEm: now,
    ...overrides,
  });
}

// ========== FIXTURES DE ESTATÍSTICAS (REI DA PRAIA) ==========

/**
 * Estatísticas de jogador para testes
 */
export function createEstatisticasJogadorFixture(
  overrides: Partial<EstatisticasJogador> = {}
): EstatisticasJogador {
  const now = createMockTimestamp();

  return {
    id: `stats-${TEST_IDS.jogador1}`,
    etapaId: TEST_IDS.etapa,
    arenaId: TEST_IDS.arena,
    jogadorId: TEST_IDS.jogador1,
    jogadorNome: "João Silva",
    jogadorNivel: NivelJogador.INTERMEDIARIO,
    jogadorGenero: GeneroJogador.MASCULINO,
    grupoId: TEST_IDS.grupo1,
    grupoNome: "Grupo A",
    jogosGrupo: 0,
    vitoriasGrupo: 0,
    derrotasGrupo: 0,
    pontosGrupo: 0,
    setsVencidosGrupo: 0,
    setsPerdidosGrupo: 0,
    saldoSetsGrupo: 0,
    gamesVencidosGrupo: 0,
    gamesPerdidosGrupo: 0,
    saldoGamesGrupo: 0,
    jogos: 0,
    vitorias: 0,
    derrotas: 0,
    pontos: 0,
    setsVencidos: 0,
    setsPerdidos: 0,
    gamesVencidos: 0,
    gamesPerdidos: 0,
    saldoSets: 0,
    saldoGames: 0,
    posicaoGrupo: undefined,
    classificado: false,
    criadoEm: now,
    atualizadoEm: now,
    ...overrides,
  };
}

// ========== FIXTURES DE CONFRONTO ELIMINATÓRIO ==========

/**
 * Confronto eliminatório para testes
 */
export function createConfrontoFixture(
  overrides: Partial<ConfrontoEliminatorio> = {}
): ConfrontoEliminatorio {
  const now = createMockTimestamp();

  return {
    id: TEST_IDS.confronto1,
    etapaId: TEST_IDS.etapa,
    arenaId: TEST_IDS.arena,
    fase: TipoFase.SEMIFINAL,
    ordem: 1,
    dupla1Id: TEST_IDS.dupla1,
    dupla1Nome: "João & Pedro",
    dupla1Origem: "1º Grupo A",
    dupla2Id: TEST_IDS.dupla2,
    dupla2Nome: "Maria & Ana",
    dupla2Origem: "2º Grupo B",
    partidaId: undefined,
    status: StatusConfrontoEliminatorio.AGENDADA,
    vencedoraId: undefined,
    vencedoraNome: undefined,
    placar: undefined,
    proximoConfrontoId: undefined,
    criadoEm: now,
    atualizadoEm: now,
    ...overrides,
  };
}

// ========== EXPORTS ==========
export {
  // Enums re-exported para conveniência nos testes
  NivelJogador,
  StatusJogador,
  GeneroJogador,
  StatusEtapa,
  FaseEtapa,
  FormatoEtapa,
  StatusInscricao,
  StatusPartida,
  TipoFase,
  StatusConfrontoEliminatorio,
};
