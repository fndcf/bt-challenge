/**
 * Interface do repository de Cabeça de Chave
 */

import {
  AtualizarCabecaDeChaveDTO,
  CabecaDeChave,
  CriarCabecaDeChaveDTO,
} from "../../models/CabecaDeChave";

export interface ICabecaDeChaveRepository {
  criar(dto: CriarCabecaDeChaveDTO): Promise<CabecaDeChave>;

  /**
   * Buscar a cabeça de chave ativa do jogador na etapa
   */
  buscarPorJogador(
    arenaId: string,
    etapaId: string,
    jogadorId: string
  ): Promise<CabecaDeChave | null>;

  /**
   * Listar as ativas da etapa, na ordem
   */
  listarAtivas(arenaId: string, etapaId: string): Promise<CabecaDeChave[]>;

  /**
   * Atualizar só os campos informados
   */
  atualizar(id: string, dto: AtualizarCabecaDeChaveDTO): Promise<void>;

  deletar(id: string): Promise<void>;

  /**
   * Deletar todas da etapa
   * @returns Quantidade deletada
   */
  deletarPorEtapa(etapaId: string, arenaId: string): Promise<number>;
}
