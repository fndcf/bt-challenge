import {
  ConfrontoEquipe,
  CriarConfrontoDTO,
  StatusConfronto,
} from "../../models/Teams";
import { FaseEtapa } from "../../models/Etapa";

/**
 * Interface do repositório de Confrontos entre Equipes
 */
export interface IConfrontoEquipeRepository {
  // CRUD básico
  criar(dto: CriarConfrontoDTO): Promise<ConfrontoEquipe>;
  criarEmLote(dtos: CriarConfrontoDTO[]): Promise<ConfrontoEquipe[]>;
  buscarPorId(id: string): Promise<ConfrontoEquipe | null>;
  buscarPorEtapa(etapaId: string, arenaId: string): Promise<ConfrontoEquipe[]>;
  atualizar(id: string, dados: Partial<ConfrontoEquipe>): Promise<void>;
  deletar(id: string): Promise<void>;
  deletarPorEtapa(etapaId: string, arenaId: string): Promise<void>;

  // Consultas específicas
  buscarPorFase(
    etapaId: string,
    arenaId: string,
    fase: FaseEtapa
  ): Promise<ConfrontoEquipe[]>;
  buscarPorRodada(
    etapaId: string,
    arenaId: string,
    rodada: number
  ): Promise<ConfrontoEquipe[]>;
  buscarPorEquipe(
    etapaId: string,
    arenaId: string,
    equipeId: string
  ): Promise<ConfrontoEquipe[]>;

  // Resultado
  registrarResultado(
    id: string,
    jogosEquipe1: number,
    jogosEquipe2: number,
    vencedoraId: string,
    vencedoraNome: string
  ): Promise<void>;
  atualizarStatus(id: string, status: StatusConfronto): Promise<void>;

  // Partidas
  adicionarPartida(confrontoId: string, partidaId: string): Promise<void>;
  adicionarPartidasEmLote(confrontoId: string, partidaIds: string[]): Promise<void>;
  incrementarPartidasFinalizadas(confrontoId: string): Promise<void>;
  atualizarContadorJogos(
    confrontoId: string,
    jogosEquipe1: number,
    jogosEquipe2: number
  ): Promise<void>;
  marcarTemDecider(confrontoId: string, temDecider: boolean): Promise<void>;

  // Ordenação
  buscarPorEtapaOrdenados(
    etapaId: string,
    arenaId: string
  ): Promise<ConfrontoEquipe[]>;

  // Contadores
  contarFinalizados(etapaId: string, arenaId: string): Promise<number>;
  contarPorFase(
    etapaId: string,
    arenaId: string,
    fase: FaseEtapa
  ): Promise<number>;
  todosFinalizadosPorFase(
    etapaId: string,
    arenaId: string,
    fase: FaseEtapa
  ): Promise<boolean>;

  // Reset
  resetarConfronto(confrontoId: string): Promise<void>;
}
