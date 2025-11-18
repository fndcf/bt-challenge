import { z } from "zod";
import { Timestamp } from "firebase-admin/firestore";

/**
 * Níveis de habilidade dos jogadores
 */
export enum NivelJogador {
  INICIANTE = "iniciante",
  INTERMEDIARIO = "intermediario",
  AVANCADO = "avancado",
  PROFISSIONAL = "profissional",
}

/**
 * Status do jogador
 */
export enum StatusJogador {
  ATIVO = "ativo",
  INATIVO = "inativo",
  SUSPENSO = "suspenso",
}

/**
 * Interface do Jogador
 */
export interface Jogador {
  id: string;
  arenaId: string;
  nome: string;
  email?: string;
  telefone?: string;
  dataNascimento?: string;
  genero?: "masculino" | "feminino" | "outro";
  nivel: NivelJogador;
  status: StatusJogador;
  observacoes?: string;

  // Estatísticas (serão implementadas depois)
  vitorias?: number;
  derrotas?: number;
  pontos?: number;

  // Metadados
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
  criadoPor: string; // UID do admin que criou
}

/**
 * Schema de validação para criar jogador (Zod)
 */
export const CriarJogadorSchema = z.object({
  nome: z
    .string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),

  email: z.string().email("Email inválido").optional().or(z.literal("")),

  telefone: z.string().optional().or(z.literal("")),

  dataNascimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida. Use formato: YYYY-MM-DD")
    .optional()
    .or(z.literal("")),

  genero: z.enum(["masculino", "feminino", "outro"]).optional(),

  nivel: z.nativeEnum(NivelJogador, {
    // ✅ CORRIGIDO: Usar apenas message, não errorMap
    message: "Nível inválido",
  }),

  status: z
    .nativeEnum(StatusJogador, {
      // ✅ CORRIGIDO: Usar apenas message, não errorMap
      message: "Status inválido",
    })
    .default(StatusJogador.ATIVO),

  observacoes: z
    .string()
    .max(500, "Observações devem ter no máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
});

/**
 * Schema de validação para atualizar jogador
 */
export const AtualizarJogadorSchema = CriarJogadorSchema.partial();

/**
 * Type inference do Zod
 */
export type CriarJogadorDTO = z.infer<typeof CriarJogadorSchema>;
export type AtualizarJogadorDTO = z.infer<typeof AtualizarJogadorSchema>;

/**
 * Filtros para buscar jogadores
 */
export interface FiltrosJogador {
  arenaId: string;
  nivel?: NivelJogador;
  status?: StatusJogador;
  genero?: "masculino" | "feminino" | "outro";
  busca?: string; // Busca por nome, email ou telefone
  ordenarPor?: "nome" | "criadoEm" | "pontos" | "vitorias";
  ordem?: "asc" | "desc";
  limite?: number;
  offset?: number;
}

/**
 * Resposta da listagem de jogadores
 */
export interface ListagemJogadores {
  jogadores: Jogador[];
  total: number;
  limite: number;
  offset: number;
  temMais: boolean;
}
