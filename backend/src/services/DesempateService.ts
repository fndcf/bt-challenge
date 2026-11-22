/**
 * Service de desempate de posições nos grupos
 * Responsabilidades:
 * - Classificar um grupo aplicando os desempates definidos pelo admin
 * - Registrar empates pendentes (empate em todos os critérios, grupo encerrado)
 * - Salvar a decisão do admin (sorteio ou ordem manual)
 * - Bloquear ações que dependem da classificação enquanto houver empate pendente
 *
 * Os dados ficam na própria etapa (empatesPendentes / desempates, por grupoId)
 * para funcionar igual em todos os formatos, inclusive TEAMS (sem documento de grupo).
 */

import {
  EmpatePendente,
  DesempateDefinido,
  ModoDesempate,
  ParticipanteEmpate,
} from "../models/Etapa";
import {
  BlocoEmpatado,
  ordenarComDesempate,
  mesmosIds,
  listarEmpatesPendentes,
  garantirSemEmpatesPendentes,
} from "../utils/desempate";
import { IEtapaRepository } from "../repositories/interfaces/IEtapaRepository";
import { etapaRepository } from "../repositories/firebase/EtapaRepository";
import { embaralhar } from "../utils/arrayUtils";
import logger from "../utils/logger";

export interface ClassificarGrupoParams<T> {
  etapaId: string;
  grupoId: string;
  grupoNome: string;
  itens: T[];
  comparar: (a: T, b: T) => number;
  getId: (item: T) => string;
  getNome: (item: T) => string;
  // Empates só viram pendência quando todas as partidas do grupo terminaram
  grupoCompleto: boolean;
  // false = não mexer nas pendências (ex: TEAMS após preencher a eliminatória)
  atualizarPendencias?: boolean;
  // Só vira pendência o empate em que a ordem muda algo (padrão: todos)
  empateRelevante?: (empate: BlocoEmpatado) => boolean;
  // Explicação extra exibida no modal
  contexto?: string;
}

export class DesempateService {
  constructor(private etapas: IEtapaRepository = etapaRepository) {}

  /**
   * Ordenar participantes do grupo e atualizar os empates pendentes
   */
  async classificarGrupo<T>(params: ClassificarGrupoParams<T>): Promise<T[]> {
    const { etapaId, grupoId, grupoNome, itens, getId, getNome } = params;

    const etapa = await this.etapas.buscarPorId(etapaId);
    const { ordenados, empates } = ordenarComDesempate(
      itens,
      params.comparar,
      getId,
      etapa?.desempates?.[grupoId] ?? []
    );

    if (etapa && params.atualizarPendencias !== false) {
      const nomes = new Map(itens.map((item) => [getId(item), getNome(item)]));
      const empateRelevante = params.empateRelevante ?? (() => true);
      const pendentes: EmpatePendente[] = params.grupoCompleto
        ? empates.filter(empateRelevante).map((empate) => ({
            grupoId,
            grupoNome,
            posicaoInicial: empate.posicaoInicial,
            participantes: empate.ids.map((id) => ({
              id,
              nome: nomes.get(id) || "",
            })),
            // Firestore não aceita campos undefined
            ...(params.contexto ? { contexto: params.contexto } : {}),
          }))
        : [];

      const atuais = etapa.empatesPendentes?.[grupoId] ?? [];
      if (JSON.stringify(atuais) !== JSON.stringify(pendentes)) {
        await this.etapas.salvarEmpatesPendentes(etapaId, grupoId, pendentes);

        if (pendentes.length > 0) {
          logger.info("Empate pendente detectado", {
            etapaId,
            grupoId,
            empates: pendentes.length,
          });
        }
      }
    }

    return ordenados;
  }

  /**
   * Listar empates pendentes da etapa (todos os grupos)
   */
  async listarPendentes(etapaId: string): Promise<EmpatePendente[]> {
    return listarEmpatesPendentes(await this.etapas.buscarPorId(etapaId));
  }

  /**
   * Lançar erro se a etapa tiver empate pendente
   *
   * @param acao - Texto da ação bloqueada (ex: "gerar a fase eliminatória")
   * @param filtro - Considerar apenas os empates que passam no filtro
   */
  async garantirSemEmpatesPendentes(
    etapaId: string,
    acao: string,
    filtro?: (empate: EmpatePendente) => boolean
  ): Promise<void> {
    garantirSemEmpatesPendentes(await this.etapas.buscarPorId(etapaId), acao, filtro);
  }

  /**
   * Salvar a decisão do admin para um empate pendente
   *
   * Remove a pendência resolvida. Para empates de grupo, o chamador ainda
   * deve recalcular a classificação do grupo para aplicar a nova ordem.
   *
   * @param ids - Participantes empatados; no modo manual, na ordem escolhida
   */
  async definirDesempate(
    etapaId: string,
    grupoId: string,
    ids: string[],
    modo: ModoDesempate
  ): Promise<{ modo: ModoDesempate; participantes: ParticipanteEmpate[] }> {
    const etapa = await this.etapas.buscarPorId(etapaId);
    if (!etapa) {
      throw new Error("Etapa não encontrada");
    }

    const empate = (etapa.empatesPendentes?.[grupoId] ?? []).find((e) =>
      mesmosIds(
        e.participantes.map((p) => p.id),
        ids
      )
    );
    if (!empate) {
      throw new Error("Empate não encontrado ou já resolvido");
    }

    const ordem = modo === "sorteio" ? embaralhar(ids) : ids;

    // Substitui decisão anterior para o mesmo bloco, se existir
    const desempatesGrupo: DesempateDefinido[] = [
      ...(etapa.desempates?.[grupoId] ?? []).filter(
        (d) => !mesmosIds(d.ids, ordem)
      ),
      { ids: ordem, modo },
    ];

    const pendentesRestantes = (etapa.empatesPendentes?.[grupoId] ?? []).filter(
      (e) => e !== empate
    );

    await this.etapas.salvarDesempates(
      etapaId,
      grupoId,
      desempatesGrupo,
      pendentesRestantes
    );

    const nomes = new Map(empate.participantes.map((p) => [p.id, p.nome]));
    const participantes = ordem.map((id) => ({ id, nome: nomes.get(id) || "" }));

    logger.info("Desempate definido", {
      etapaId,
      grupoId,
      modo,
      ordem: participantes.map((p) => p.nome),
    });

    return { modo, participantes };
  }

  /**
   * Atualizar o nome de um participante nos empates pendentes
   */
  async renomearParticipante(
    etapaId: string,
    participanteId: string,
    nome: string
  ): Promise<void> {
    const etapa = await this.etapas.buscarPorId(etapaId);

    for (const [grupoId, empates] of Object.entries(
      etapa?.empatesPendentes ?? {}
    )) {
      const participa = empates.some((e) =>
        e.participantes.some((p) => p.id === participanteId)
      );
      if (!participa) continue;

      const atualizados = empates.map((e) => ({
        ...e,
        participantes: e.participantes.map((p) =>
          p.id === participanteId ? { ...p, nome } : p
        ),
      }));
      await this.etapas.salvarEmpatesPendentes(etapaId, grupoId, atualizados);
    }
  }

  /**
   * Limpar empates e desempates (ao excluir/cancelar chaves)
   */
  async limpar(etapaId: string): Promise<void> {
    await this.etapas.limparDesempates(etapaId);
  }

  /**
   * Limpar empates (e opcionalmente desempates) de chaves específicas
   *
   * @param incluirDesempates - true também apaga as decisões já tomadas
   */
  async limparGrupos(
    etapaId: string,
    grupoIds: string[],
    incluirDesempates = false
  ): Promise<void> {
    await this.etapas.limparEmpatesDosGrupos(
      etapaId,
      grupoIds,
      incluirDesempates
    );
  }
}

export default new DesempateService();
