import { z } from "zod";
import { Timestamp } from "firebase-admin/firestore";
import { GeneroJogador } from "./Jogador";

/**
 * Enums
 */
export enum NivelJogador {
  INICIANTE = "iniciante",
  INTERMEDIARIO = "intermediario",
  AVANCADO = "avancado",
}

export enum StatusEtapa {
  RASCUNHO = "rascunho",
  INSCRICOES_ABERTAS = "inscricoes_abertas",
  INSCRICOES_ENCERRADAS = "inscricoes_encerradas",
  CHAVES_GERADAS = "chaves_geradas",
  EM_ANDAMENTO = "em_andamento",
  FINALIZADA = "finalizada",
  FASE_ELIMINATORIA = "FASE_ELIMINATORIA",
}

export enum FaseEtapa {
  GRUPOS = "grupos",
  OITAVAS = "oitavas",
  QUARTAS = "quartas",
  SEMIFINAL = "semifinal",
  FINAL = "final",
}

export enum FormatoEtapa {
  DUPLA_FIXA = "dupla_fixa",
  REI_DA_PRAIA = "rei_da_praia",
}

export enum TipoChaveamentoReiDaPraia {
  MELHORES_COM_MELHORES = "melhores_com_melhores",
  PAREAMENTO_POR_RANKING = "pareamento_por_ranking",
  SORTEIO_ALEATORIO = "sorteio_aleatorio",
}

/**
 * Interface da Etapa
 */
export interface Etapa {
  id: string;
  arenaId: string;

  // Informações básicas
  nome: string; // "Etapa 1 - Novembro 2025"
  descricao?: string;
  nivel: NivelJogador;
  genero: GeneroJogador;
  formato: FormatoEtapa;
  tipoChaveamento?: TipoChaveamentoReiDaPraia;
  dataInicio: Timestamp | string; // Início das inscrições
  dataFim: Timestamp | string; // Fim das inscrições
  dataRealizacao: Timestamp | string; // Data dos jogos
  local?: string;

  // Configurações
  maxJogadores: number; // Ex: 16, 24, 32
  jogadoresPorGrupo: number; // Ex: 3 ou 4 duplas por grupo
  qtdGrupos?: number; // Calculado automaticamente

  // Status
  status: StatusEtapa;
  faseAtual: FaseEtapa;

  // Inscrições
  totalInscritos: number;
  jogadoresInscritos: string[]; // Array de IDs dos jogadores

  // Chaves geradas
  chavesGeradas: boolean;
  dataGeracaoChaves?: Timestamp | string;
  campeaoId?: string;
  campeaoNome?: string;
  dataEncerramentoEm?: Timestamp;

  // Metadados
  criadoEm: Timestamp | string;
  atualizadoEm: Timestamp | string;
  criadoPor: string;
  finalizadoEm?: Timestamp | string;
}

/**
 * DTOs
 */

// Criar Etapa
export const CriarEtapaSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100),
  descricao: z.string().max(500).optional(),
  nivel: z.nativeEnum(NivelJogador),
  genero: z.enum(GeneroJogador, {
    message: "Gênero é obrigatório (masculino ou feminino)",
  }),
  formato: z.nativeEnum(FormatoEtapa).default(FormatoEtapa.DUPLA_FIXA),
  tipoChaveamento: z.nativeEnum(TipoChaveamentoReiDaPraia).optional(),
  dataInicio: z.string().datetime().or(z.date()),
  dataFim: z.string().datetime().or(z.date()),
  dataRealizacao: z.string().datetime().or(z.date()),
  local: z.string().max(200).optional(),
  maxJogadores: z
    .number()
    .min(6, "Mínimo de 6 jogadores (3 duplas)")
    .max(64, "Máximo de 64 jogadores")
    .refine((val) => val % 2 === 0, {
      message: "Número de jogadores deve ser par",
    }),
  jogadoresPorGrupo: z.number().min(3).max(5),
});

export type CriarEtapaDTO = z.infer<typeof CriarEtapaSchema>;

// Atualizar Etapa
export const AtualizarEtapaSchema = z.object({
  nome: z.string().min(3).max(100).optional(),
  descricao: z.string().max(500).optional(),
  nivel: z.nativeEnum(NivelJogador).optional(),
  genero: z.enum(GeneroJogador).optional(),
  formato: z.nativeEnum(FormatoEtapa).optional(),
  tipoChaveamento: z.nativeEnum(TipoChaveamentoReiDaPraia).optional(),
  dataInicio: z.string().datetime().or(z.date()).optional(),
  dataFim: z.string().datetime().or(z.date()).optional(),
  dataRealizacao: z.string().datetime().or(z.date()).optional(),
  local: z.string().max(200).optional(),
  maxJogadores: z
    .number()
    .min(6, "Mínimo de 6 jogadores (3 duplas)")
    .max(64, "Máximo de 64 jogadores")
    .refine((val) => val % 2 === 0, {
      message: "Número de jogadores deve ser par",
    })
    .optional(),
  status: z.nativeEnum(StatusEtapa).optional(),
});

export type AtualizarEtapaDTO = z.infer<typeof AtualizarEtapaSchema>;

// Inscrever Jogador
export const InscreverJogadorSchema = z.object({
  jogadorId: z.string().min(1, "Jogador é obrigatório"),
});

export type InscreverJogadorDTO = z.infer<typeof InscreverJogadorSchema>;

// Filtros
export interface FiltrosEtapa {
  arenaId: string;
  status?: StatusEtapa;
  dataInicio?: string;
  dataFim?: string;
  ordenarPor?: "dataRealizacao" | "criadoEm";
  ordem?: "asc" | "desc";
  limite?: number;
  offset?: number;
}

// Listagem
export interface ListagemEtapas {
  etapas: Etapa[];
  total: number;
  limite: number;
  offset: number;
  temMais: boolean;
}

// Estatísticas
export interface EstatisticasEtapa {
  totalEtapas: number;
  inscricoesAbertas: number;
  emAndamento: number;
  finalizadas: number;
  totalParticipacoes: number;
}
