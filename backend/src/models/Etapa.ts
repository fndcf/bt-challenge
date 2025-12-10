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
  INSCRICOES_ABERTAS = "inscricoes_abertas",
  INSCRICOES_ENCERRADAS = "inscricoes_encerradas",
  CHAVES_GERADAS = "chaves_geradas",
  EM_ANDAMENTO = "em_andamento",
  FINALIZADA = "finalizada",
  FASE_ELIMINATORIA = "fase_eliminatoria",
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
  SUPER_X = "super_x",
}

// Variantes do Super X
export enum VarianteSuperX {
  SUPER_8 = 8,
  SUPER_12 = 12,
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
  nivel?: NivelJogador; // Opcional para formato SUPER_X
  genero: GeneroJogador;
  formato: FormatoEtapa;
  tipoChaveamento?: TipoChaveamentoReiDaPraia;
  varianteSuperX?: VarianteSuperX; // Usado apenas para formato SUPER_X
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

  // Ranking
  contaPontosRanking: boolean; // Se true, os pontos da etapa contam para o ranking geral

  // Metadados
  criadoEm: Timestamp | string;
  atualizadoEm: Timestamp | string;
  criadoPor: string;
  finalizadoEm?: Timestamp | string;
}

/**
 * DTOs
 */

// Criar Etapa - Schema base
const CriarEtapaSchemaBase = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100),
  descricao: z.string().max(500).optional(),
  nivel: z.nativeEnum(NivelJogador).optional(), // Opcional para SUPER_X
  genero: z.enum(GeneroJogador, {
    message: "Gênero é obrigatório (masculino ou feminino)",
  }),
  formato: z.nativeEnum(FormatoEtapa).default(FormatoEtapa.DUPLA_FIXA),
  tipoChaveamento: z.nativeEnum(TipoChaveamentoReiDaPraia).optional(),
  varianteSuperX: z.nativeEnum(VarianteSuperX).optional(), // Apenas para SUPER_X
  dataInicio: z.string().datetime().or(z.date()),
  dataFim: z.string().datetime().or(z.date()),
  dataRealizacao: z.string().datetime().or(z.date()),
  local: z.string().max(200).optional(),
  maxJogadores: z
    .number()
    .min(6, "Mínimo de 6 jogadores")
    .max(64, "Máximo de 64 jogadores"),
  jogadoresPorGrupo: z.number().min(3).max(12).optional(), // max 12 para SUPER_X (grupo único)
  contaPontosRanking: z.boolean().default(true),
});

// Criar Etapa - Com validações condicionais
export const CriarEtapaSchema = CriarEtapaSchemaBase.superRefine(
  (data, ctx) => {
    // Validação: nivel é obrigatório para DUPLA_FIXA e REI_DA_PRAIA
    if (data.formato !== FormatoEtapa.SUPER_X && !data.nivel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nível é obrigatório para este formato",
        path: ["nivel"],
      });
    }

    // Validação: varianteSuperX é obrigatório para SUPER_X
    if (data.formato === FormatoEtapa.SUPER_X && !data.varianteSuperX) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Variante é obrigatória para formato Super X",
        path: ["varianteSuperX"],
      });
    }

    // Validação: maxJogadores deve corresponder à variante para SUPER_X
    if (data.formato === FormatoEtapa.SUPER_X && data.varianteSuperX) {
      if (data.maxJogadores !== data.varianteSuperX) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Super ${data.varianteSuperX} requer exatamente ${data.varianteSuperX} jogadores`,
          path: ["maxJogadores"],
        });
      }
    }

    // Validação: número de jogadores deve ser par para DUPLA_FIXA e REI_DA_PRAIA
    if (data.formato !== FormatoEtapa.SUPER_X && data.maxJogadores % 2 !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Número de jogadores deve ser par",
        path: ["maxJogadores"],
      });
    }

    // Validação: REI_DA_PRAIA requer múltiplo de 4
    if (
      data.formato === FormatoEtapa.REI_DA_PRAIA &&
      data.maxJogadores % 4 !== 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Rei da Praia requer número de jogadores múltiplo de 4",
        path: ["maxJogadores"],
      });
    }

    // Validação: jogadoresPorGrupo é obrigatório para DUPLA_FIXA
    if (data.formato === FormatoEtapa.DUPLA_FIXA && !data.jogadoresPorGrupo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Jogadores por grupo é obrigatório para Dupla Fixa",
        path: ["jogadoresPorGrupo"],
      });
    }

    // Validação: jogadoresPorGrupo máximo 4 para DUPLA_FIXA e REI_DA_PRAIA
    if (
      data.formato !== FormatoEtapa.SUPER_X &&
      data.jogadoresPorGrupo &&
      data.jogadoresPorGrupo > 4
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Máximo de 4 jogadores por grupo para este formato",
        path: ["jogadoresPorGrupo"],
      });
    }

    // Validação: jogadoresPorGrupo para SUPER_X deve ser igual à variante (grupo único)
    if (
      data.formato === FormatoEtapa.SUPER_X &&
      data.varianteSuperX &&
      data.jogadoresPorGrupo &&
      data.jogadoresPorGrupo !== data.varianteSuperX
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Super ${data.varianteSuperX} requer grupo único com ${data.varianteSuperX} jogadores`,
        path: ["jogadoresPorGrupo"],
      });
    }
  }
);

export type CriarEtapaDTO = z.infer<typeof CriarEtapaSchemaBase>;

// Atualizar Etapa
export const AtualizarEtapaSchema = z.object({
  nome: z.string().min(3).max(100).optional(),
  descricao: z.string().max(500).optional(),
  nivel: z.nativeEnum(NivelJogador).optional(),
  genero: z.enum(GeneroJogador).optional(),
  formato: z.nativeEnum(FormatoEtapa).optional(),
  tipoChaveamento: z.nativeEnum(TipoChaveamentoReiDaPraia).optional(),
  varianteSuperX: z.nativeEnum(VarianteSuperX).optional(),
  dataInicio: z.string().datetime().or(z.date()).optional(),
  dataFim: z.string().datetime().or(z.date()).optional(),
  dataRealizacao: z.string().datetime().or(z.date()).optional(),
  local: z.string().max(200).optional(),
  maxJogadores: z
    .number()
    .min(6, "Mínimo de 6 jogadores")
    .max(64, "Máximo de 64 jogadores")
    .optional(),
  status: z.nativeEnum(StatusEtapa).optional(),
  contaPontosRanking: z.boolean().optional(),
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
  nivel?: NivelJogador;
  genero?: GeneroJogador;
  formato?: FormatoEtapa;
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
