import {
  PartidaTeams,
  CriarPartidaTeamsDTO,
  SetPlacarTeams,
  TipoJogoTeams,
} from "../../models/Teams";
import { StatusPartida } from "../../models/Partida";

/**
 * Interface do repositório de Partidas do formato TEAMS
 */
export interface IPartidaTeamsRepository {
  // CRUD básico
  criarEmLote(dtos: CriarPartidaTeamsDTO[]): Promise<PartidaTeams[]>;
  buscarPorId(id: string): Promise<PartidaTeams | null>;
  buscarPorEtapa(etapaId: string, arenaId: string): Promise<PartidaTeams[]>;
  atualizar(id: string, dados: Partial<PartidaTeams>): Promise<void>;
  deletar(id: string): Promise<void>;
  deletarPorEtapa(etapaId: string, arenaId: string): Promise<void>;

  // Consultas por confronto
  buscarPorConfronto(confrontoId: string): Promise<PartidaTeams[]>;
  buscarPorConfrontoOrdenadas(confrontoId: string): Promise<PartidaTeams[]>;
  deletarPorConfronto(confrontoId: string): Promise<void>;

  // Consultas específicas
  buscarPorTipo(
    confrontoId: string,
    tipoJogo: TipoJogoTeams
  ): Promise<PartidaTeams | null>;
  buscarDecider(confrontoId: string): Promise<PartidaTeams | null>;

  // Resultado
  registrarResultado(
    id: string,
    placar: SetPlacarTeams[],
    setsDupla1: number,
    setsDupla2: number,
    vencedoraEquipeId: string,
    vencedoraEquipeNome: string
  ): Promise<void>;
  atualizarStatus(id: string, status: StatusPartida): Promise<void>;
  limparResultado(id: string): Promise<void>;

  // Contadores
  contarFinalizadasPorConfronto(confrontoId: string): Promise<number>;
  contarPorConfronto(confrontoId: string): Promise<number>;

  // Verificações
  existeDecider(confrontoId: string): Promise<boolean>;
}
