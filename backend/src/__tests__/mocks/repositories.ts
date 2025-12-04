/**
 * Mocks tipados dos repositories para testes
 *
 * IMPORTANTE: Cada mock implementa a interface real do repository.
 * Isso garante que mudanças nas interfaces quebrem os testes.
 */

import { IJogadorRepository } from "../../repositories/interfaces/IJogadorRepository";
import { IEtapaRepository } from "../../repositories/interfaces/IEtapaRepository";
import { IInscricaoRepository } from "../../repositories/interfaces/IInscricaoRepository";
import { IDuplaRepository } from "../../repositories/interfaces/IDuplaRepository";
import { IGrupoRepository } from "../../repositories/interfaces/IGrupoRepository";
import { IPartidaRepository } from "../../repositories/interfaces/IPartidaRepository";
import { IConfrontoEliminatorioRepository } from "../../repositories/interfaces/IConfrontoEliminatorioRepository";
import { IEstatisticasJogadorRepository } from "../../repositories/interfaces/IEstatisticasJogadorRepository";
import { IPartidaReiDaPraiaRepository } from "../../repositories/interfaces/IPartidaReiDaPraiaRepository";
import { ICabecaDeChaveRepository } from "../../repositories/interfaces/ICabecaDeChaveRepository";
import { IConfigRepository } from "../../repositories/interfaces/IConfigRepository";

// ========== MOCK JOGADOR REPOSITORY ==========

type MockedJogadorRepository = {
  [K in keyof IJogadorRepository]: jest.Mock;
};

export function createMockJogadorRepository(): MockedJogadorRepository {
  return {
    // IBaseRepository
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    atualizar: jest.fn(),
    deletar: jest.fn(),
    existe: jest.fn(),
    // IJogadorRepository específicos
    buscarPorIdEArena: jest.fn(),
    buscarPorNome: jest.fn(),
    listar: jest.fn(),
    buscarPorIds: jest.fn(),
    buscarPorNivel: jest.fn(),
    buscarPorStatus: jest.fn(),
    buscarPorGenero: jest.fn(),
    buscarAtivos: jest.fn(),
    atualizarEstatisticas: jest.fn(),
    incrementarVitorias: jest.fn(),
    incrementarDerrotas: jest.fn(),
    contar: jest.fn(),
    contarPorNivel: jest.fn(),
    contarPorGenero: jest.fn(),
    nomeExiste: jest.fn(),
  };
}

// ========== MOCK ETAPA REPOSITORY ==========

type MockedEtapaRepository = {
  [K in keyof IEtapaRepository]: jest.Mock;
};

export function createMockEtapaRepository(): MockedEtapaRepository {
  return {
    // IBaseRepository
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    atualizar: jest.fn(),
    deletar: jest.fn(),
    existe: jest.fn(),
    // IEtapaRepository específicos
    buscarPorIdEArena: jest.fn(),
    listar: jest.fn(),
    buscarPorStatus: jest.fn(),
    buscarAtivas: jest.fn(),
    atualizarStatus: jest.fn(),
    marcarChavesGeradas: jest.fn(),
    incrementarInscritos: jest.fn(),
    decrementarInscritos: jest.fn(),
    definirCampeao: jest.fn(),
    obterEstatisticas: jest.fn(),
    contar: jest.fn(),
    jogadorInscrito: jest.fn(),
  };
}

// ========== MOCK INSCRICAO REPOSITORY ==========

type MockedInscricaoRepository = {
  [K in keyof IInscricaoRepository]: jest.Mock;
};

export function createMockInscricaoRepository(): MockedInscricaoRepository {
  return {
    // IBaseRepository
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    atualizar: jest.fn(),
    deletar: jest.fn(),
    existe: jest.fn(),
    // IBatchOperations
    criarEmLote: jest.fn(),
    deletarEmLote: jest.fn(),
    atualizarEmLote: jest.fn(),
    // IInscricaoRepository específicos
    buscarPorIdEArena: jest.fn(),
    buscarPorIdEtapaArena: jest.fn(),
    buscarPorEtapa: jest.fn(),
    buscarConfirmadas: jest.fn(),
    buscarPorJogadorEEtapa: jest.fn(),
    buscarPorJogador: jest.fn(),
    buscarAtivasPorJogador: jest.fn(),
    jogadorInscrito: jest.fn(),
    atualizarStatus: jest.fn(),
    cancelar: jest.fn(),
    atribuirDupla: jest.fn(),
    atribuirGrupo: jest.fn(),
    limparAtribuicoes: jest.fn(),
    deletarPorEtapa: jest.fn(),
    contar: jest.fn(),
    contarConfirmadas: jest.fn(),
  };
}

// ========== MOCK DUPLA REPOSITORY ==========

type MockedDuplaRepository = {
  [K in keyof IDuplaRepository]: jest.Mock;
};

export function createMockDuplaRepository(): MockedDuplaRepository {
  return {
    // IBaseRepository
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    atualizar: jest.fn(),
    deletar: jest.fn(),
    existe: jest.fn(),
    // IBatchOperations
    criarEmLote: jest.fn(),
    deletarEmLote: jest.fn(),
    atualizarEmLote: jest.fn(),
    // IDuplaRepository específicos
    buscarPorIdEArena: jest.fn(),
    buscarPorEtapa: jest.fn(),
    buscarPorGrupo: jest.fn(),
    buscarPorGrupoOrdenado: jest.fn(),
    buscarClassificadas: jest.fn(),
    buscarClassificadasPorGrupo: jest.fn(),
    buscarPorJogador: jest.fn(),
    atribuirGrupo: jest.fn(),
    atualizarEstatisticas: jest.fn(),
    registrarResultadoPartida: jest.fn(),
    atualizarPosicaoGrupo: jest.fn(),
    marcarClassificada: jest.fn(),
    deletarPorEtapa: jest.fn(),
    contar: jest.fn(),
    contarPorGrupo: jest.fn(),
  };
}

// ========== MOCK GRUPO REPOSITORY ==========

type MockedGrupoRepository = {
  [K in keyof IGrupoRepository]: jest.Mock;
};

export function createMockGrupoRepository(): MockedGrupoRepository {
  return {
    // IBaseRepository
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    atualizar: jest.fn(),
    deletar: jest.fn(),
    existe: jest.fn(),
    // IBatchOperations
    criarEmLote: jest.fn(),
    deletarEmLote: jest.fn(),
    atualizarEmLote: jest.fn(),
    // IGrupoRepository específicos
    buscarPorIdEArena: jest.fn(),
    buscarPorEtapa: jest.fn(),
    buscarPorEtapaOrdenado: jest.fn(),
    buscarCompletos: jest.fn(),
    buscarIncompletos: jest.fn(),
    adicionarDupla: jest.fn(),
    removerDupla: jest.fn(),
    adicionarPartida: jest.fn(),
    incrementarPartidasFinalizadas: jest.fn(),
    decrementarPartidasFinalizadas: jest.fn(),
    marcarCompleto: jest.fn(),
    definirClassificadas: jest.fn(),
    atualizarContadores: jest.fn(),
    deletarPorEtapa: jest.fn(),
    contar: jest.fn(),
    todosCompletos: jest.fn(),
  };
}

// ========== MOCK PARTIDA REPOSITORY ==========

type MockedPartidaRepository = {
  [K in keyof IPartidaRepository]: jest.Mock;
};

export function createMockPartidaRepository(): MockedPartidaRepository {
  return {
    // IBaseRepository
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    atualizar: jest.fn(),
    deletar: jest.fn(),
    existe: jest.fn(),
    // IBatchOperations
    criarEmLote: jest.fn(),
    deletarEmLote: jest.fn(),
    atualizarEmLote: jest.fn(),
    // IPartidaRepository específicos
    buscarPorIdEArena: jest.fn(),
    buscarPorEtapa: jest.fn(),
    buscarPorGrupo: jest.fn(),
    buscarPorGrupoOrdenado: jest.fn(),
    buscarPorFase: jest.fn(),
    buscarPorTipo: jest.fn(),
    buscarPorStatus: jest.fn(),
    buscarPorDupla: jest.fn(),
    buscarFinalizadasPorGrupo: jest.fn(),
    buscarPendentesPorGrupo: jest.fn(),
    buscarConfrontoDireto: jest.fn(),
    registrarResultado: jest.fn(),
    agendar: jest.fn(),
    cancelar: jest.fn(),
    deletarPorEtapa: jest.fn(),
    deletarPorGrupo: jest.fn(),
    deletarEliminatoriasPorEtapa: jest.fn(),
    contar: jest.fn(),
    contarFinalizadasPorGrupo: jest.fn(),
    contarPendentes: jest.fn(),
  };
}

// ========== MOCK CONFRONTO ELIMINATORIO REPOSITORY ==========

type MockedConfrontoRepository = {
  [K in keyof IConfrontoEliminatorioRepository]: jest.Mock;
};

export function createMockConfrontoRepository(): MockedConfrontoRepository {
  return {
    // IBaseRepository
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    atualizar: jest.fn(),
    deletar: jest.fn(),
    existe: jest.fn(),
    // IBatchOperations
    criarEmLote: jest.fn(),
    deletarEmLote: jest.fn(),
    atualizarEmLote: jest.fn(),
    // IConfrontoEliminatorioRepository específicos
    buscarPorIdEArena: jest.fn(),
    buscarPorEtapa: jest.fn(),
    buscarPorEtapaOrdenado: jest.fn(),
    buscarPorFase: jest.fn(),
    buscarPorFaseOrdenado: jest.fn(),
    buscarPorStatus: jest.fn(),
    buscarPorDupla: jest.fn(),
    buscarFinalizadosPorFase: jest.fn(),
    buscarPendentesPorFase: jest.fn(),
    registrarResultado: jest.fn(),
    atualizarDuplas: jest.fn(),
    limparResultado: jest.fn(),
    definirProximoConfronto: jest.fn(),
    deletarPorEtapa: jest.fn(),
    deletarPorFase: jest.fn(),
    contar: jest.fn(),
    contarPorFase: jest.fn(),
    faseCompleta: jest.fn(),
    buscarVencedoresPorFase: jest.fn(),
  };
}

// ========== MOCK ESTATISTICAS JOGADOR REPOSITORY ==========

type MockedEstatisticasRepository = {
  [K in keyof IEstatisticasJogadorRepository]: jest.Mock;
};

export function createMockEstatisticasRepository(): MockedEstatisticasRepository {
  return {
    // IBaseRepository (sem 'listar')
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    atualizar: jest.fn(),
    deletar: jest.fn(),
    existe: jest.fn(),
    // IEstatisticasJogadorRepository específicos
    buscarPorEtapa: jest.fn(),
    buscarPorJogadorEEtapa: jest.fn(),
    buscarPorGrupo: jest.fn(),
    buscarPorGrupoOrdenado: jest.fn(),
    atualizarEstatisticasPartida: jest.fn(),
    incrementarEstatisticas: jest.fn(),
    atualizarPosicaoGrupo: jest.fn(),
    atualizarPontuacao: jest.fn(),
    atribuirGrupo: jest.fn(),
    deletarPorEtapa: jest.fn(),
    recalcularSaldos: jest.fn(),
    zerarEstatisticas: jest.fn(),
  };
}

// ========== MOCK PARTIDA REI DA PRAIA REPOSITORY ==========

type MockedPartidaReiDaPraiaRepository = {
  [K in keyof IPartidaReiDaPraiaRepository]: jest.Mock;
};

export function createMockPartidaReiDaPraiaRepository(): MockedPartidaReiDaPraiaRepository {
  return {
    // IBaseRepository
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    atualizar: jest.fn(),
    deletar: jest.fn(),
    existe: jest.fn(),
    // IBatchOperations
    criarEmLote: jest.fn(),
    deletarEmLote: jest.fn(),
    atualizarEmLote: jest.fn(),
    // IPartidaReiDaPraiaRepository específicos
    buscarPorIdEArena: jest.fn(),
    buscarPorEtapa: jest.fn(),
    buscarPorGrupo: jest.fn(),
    buscarPorFase: jest.fn(),
    buscarPartidasGrupos: jest.fn(),
    buscarPartidasEliminatorias: jest.fn(),
    buscarFinalizadas: jest.fn(),
    buscarPendentes: jest.fn(),
    registrarResultado: jest.fn(),
    limparResultado: jest.fn(),
    contarPorGrupo: jest.fn(),
    contarFinalizadasPorGrupo: jest.fn(),
    grupoCompleto: jest.fn(),
    buscarPorConfronto: jest.fn(),
    deletarPorEtapa: jest.fn(),
    deletarPartidasGrupos: jest.fn(),
    deletarPartidasEliminatorias: jest.fn(),
  };
}

// ========== MOCK CABECA DE CHAVE REPOSITORY ==========

type MockedCabecaDeChaveRepository = {
  [K in keyof ICabecaDeChaveRepository]: jest.Mock;
};

export function createMockCabecaDeChaveRepository(): MockedCabecaDeChaveRepository {
  return {
    // IBaseRepository (sem 'listar')
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    atualizar: jest.fn(),
    deletar: jest.fn(),
    existe: jest.fn(),
    // IBatchOperations
    criarEmLote: jest.fn(),
    deletarEmLote: jest.fn(),
    atualizarEmLote: jest.fn(),
    // ICabecaDeChaveRepository específicos
    buscarPorEtapa: jest.fn(),
    buscarPorEtapaOrdenado: jest.fn(),
    buscarPorJogadorEEtapa: jest.fn(),
    ehCabecaDeChave: jest.fn(),
    atualizarPosicao: jest.fn(),
    contar: jest.fn(),
    deletarPorEtapa: jest.fn(),
    removerPorJogador: jest.fn(),
  };
}

// ========== MOCK CONFIG REPOSITORY ==========

type MockedConfigRepository = {
  [K in keyof IConfigRepository]: jest.Mock;
};

export function createMockConfigRepository(): MockedConfigRepository {
  return {
    buscarConfigGlobal: jest.fn(),
    buscarPontuacao: jest.fn(),
    buscarValor: jest.fn(),
    atualizarConfig: jest.fn(),
    atualizarPontuacao: jest.fn(),
    definirValor: jest.fn(),
  };
}

// ========== FACTORY PARA TODOS OS MOCKS ==========

export interface AllMockRepositories {
  jogadorRepository: MockedJogadorRepository;
  etapaRepository: MockedEtapaRepository;
  inscricaoRepository: MockedInscricaoRepository;
  duplaRepository: MockedDuplaRepository;
  grupoRepository: MockedGrupoRepository;
  partidaRepository: MockedPartidaRepository;
  confrontoRepository: MockedConfrontoRepository;
  estatisticasRepository: MockedEstatisticasRepository;
  partidaReiDaPraiaRepository: MockedPartidaReiDaPraiaRepository;
  cabecaDeChaveRepository: MockedCabecaDeChaveRepository;
  configRepository: MockedConfigRepository;
}

/**
 * Cria todos os mocks de repositories de uma vez
 */
export function createAllMockRepositories(): AllMockRepositories {
  return {
    jogadorRepository: createMockJogadorRepository(),
    etapaRepository: createMockEtapaRepository(),
    inscricaoRepository: createMockInscricaoRepository(),
    duplaRepository: createMockDuplaRepository(),
    grupoRepository: createMockGrupoRepository(),
    partidaRepository: createMockPartidaRepository(),
    confrontoRepository: createMockConfrontoRepository(),
    estatisticasRepository: createMockEstatisticasRepository(),
    partidaReiDaPraiaRepository: createMockPartidaReiDaPraiaRepository(),
    cabecaDeChaveRepository: createMockCabecaDeChaveRepository(),
    configRepository: createMockConfigRepository(),
  };
}
