/**
 * Service para exportação de súmula (partidas dos grupos) para Excel
 * Suporta todos os formatos: Dupla Fixa, Rei da Praia, Super X e TEAMS
 */

import ExcelJS from "exceljs";
import { FormatoEtapa } from "../models/Etapa";
import logger from "../utils/logger";
import { container } from "./ServiceContainer";
import { PartidaReiDaPraiaRepository } from "../repositories/firebase/PartidaReiDaPraiaRepository";
import { ConfrontoEquipeRepository } from "../repositories/firebase/ConfrontoEquipeRepository";

class ExcelSumulaService {
  /**
   * Gerar súmula Excel baseado no formato da etapa
   */
  async gerarSumula(etapaId: string, arenaId: string): Promise<{ buffer: Buffer; nomeArquivo: string }> {
    const { etapa: etapaRepo } = container.repositories;
    const etapa = await etapaRepo.buscarPorId(etapaId);

    if (!etapa) {
      throw new Error("Etapa não encontrada");
    }

    if (etapa.arenaId !== arenaId) {
      throw new Error("Etapa não pertence a esta arena");
    }

    if (!etapa.chavesGeradas) {
      throw new Error("Chaves ainda não foram geradas para esta etapa");
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Dupley";
    workbook.created = new Date();

    switch (etapa.formato) {
      case FormatoEtapa.DUPLA_FIXA:
        await this.gerarSumulaDuplaFixa(workbook, etapaId, arenaId);
        break;
      case FormatoEtapa.REI_DA_PRAIA:
        await this.gerarSumulaReiDaPraia(workbook, etapaId, arenaId);
        break;
      case FormatoEtapa.SUPER_X:
        await this.gerarSumulaSuperX(workbook, etapaId, arenaId);
        break;
      case FormatoEtapa.TEAMS:
        await this.gerarSumulaTeams(workbook, etapaId, arenaId);
        break;
      default:
        throw new Error(`Formato não suportado: ${etapa.formato}`);
    }

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const nomeArquivo = `sumula-${etapa.nome.replace(/\s+/g, "-").toLowerCase()}.xlsx`;

    logger.info("Súmula gerada", { etapaId, formato: etapa.formato });

    return { buffer, nomeArquivo };
  }

  /**
   * Dupla Fixa: partidas por grupo
   */
  private async gerarSumulaDuplaFixa(workbook: ExcelJS.Workbook, etapaId: string, arenaId: string) {
    const { grupo: grupoRepo, partida: partidaRepo } = container.repositories;

    const grupos = await grupoRepo.buscarPorEtapa(etapaId, arenaId);
    const partidas = await partidaRepo.buscarPorEtapa(etapaId, arenaId);

    const worksheet = workbook.addWorksheet("Súmula - Fase de Grupos");
    this.aplicarEstiloHeader(worksheet, [
      "Grupo", "Partida", "Dupla 1", "vs", "Dupla 2", "Placar"
    ]);

    let rowNum = 2;
    for (const grupo of grupos.sort((a, b) => a.ordem - b.ordem)) {
      const partidasDoGrupo = partidas
        .filter((p) => p.grupoId === grupo.id && p.fase === "grupos")
        .sort((a, b) => ((a as any).numero || 0) - ((b as any).numero || 0));

      for (let i = 0; i < partidasDoGrupo.length; i++) {
        const p = partidasDoGrupo[i];
        const row = worksheet.addRow([
          grupo.nome,
          `Jogo ${i + 1}`,
          p.dupla1Nome || "—",
          "vs",
          p.dupla2Nome || "—",
          "",
        ]);
        this.estilizarLinha(row, rowNum);
        rowNum++;
      }

      worksheet.addRow([]);
      rowNum++;
    }

    this.ajustarColunas(worksheet);
  }

  /**
   * Rei da Praia: partidas por grupo e rodada
   */
  private async gerarSumulaReiDaPraia(workbook: ExcelJS.Workbook, etapaId: string, arenaId: string) {
    const { grupo: grupoRepo } = container.repositories;
    const grupos = await grupoRepo.buscarPorEtapa(etapaId, arenaId);

    const reiDaPraiaRepo = new PartidaReiDaPraiaRepository();
    const partidas = await reiDaPraiaRepo.buscarPorEtapa(etapaId, arenaId);

    const worksheet = workbook.addWorksheet("Súmula - Fase de Grupos");
    this.aplicarEstiloHeader(worksheet, [
      "Grupo", "Rodada", "Dupla 1", "vs", "Dupla 2", "Placar"
    ]);

    let rowNum = 2;
    for (const grupo of grupos.sort((a, b) => a.ordem - b.ordem)) {
      const partidasDoGrupo = (partidas as any[])
        .filter((p) => p.grupoId === grupo.id)
        .sort((a, b) => (a.rodada || 0) - (b.rodada || 0));

      for (const p of partidasDoGrupo) {
        const dupla1 = [p.jogador1ANome, p.jogador1BNome].filter(Boolean).join(" / ");
        const dupla2 = [p.jogador2ANome, p.jogador2BNome].filter(Boolean).join(" / ");

        const row = worksheet.addRow([
          grupo.nome,
          `Rodada ${p.rodada || ""}`,
          dupla1 || "—",
          "vs",
          dupla2 || "—",
          "",
        ]);
        this.estilizarLinha(row, rowNum);
        rowNum++;
      }

      worksheet.addRow([]);
      rowNum++;
    }

    this.ajustarColunas(worksheet);
  }

  /**
   * Super X: partidas por rodada (grupo único)
   */
  private async gerarSumulaSuperX(workbook: ExcelJS.Workbook, etapaId: string, arenaId: string) {
    const reiDaPraiaRepo = new PartidaReiDaPraiaRepository();
    const partidas = await reiDaPraiaRepo.buscarPorEtapa(etapaId, arenaId);

    const worksheet = workbook.addWorksheet("Súmula");
    this.aplicarEstiloHeader(worksheet, [
      "Rodada", "Dupla 1", "vs", "Dupla 2", "Placar"
    ]);

    const partidasOrdenadas = (partidas as any[])
      .sort((a, b) => (a.rodada || 0) - (b.rodada || 0));

    let rowNum = 2;
    let rodadaAtual = 0;

    for (const p of partidasOrdenadas) {
      if (p.rodada !== rodadaAtual && rodadaAtual !== 0) {
        worksheet.addRow([]);
        rowNum++;
      }
      rodadaAtual = p.rodada;

      const dupla1 = [p.jogador1ANome, p.jogador1BNome].filter(Boolean).join(" / ");
      const dupla2 = [p.jogador2ANome, p.jogador2BNome].filter(Boolean).join(" / ");

      const row = worksheet.addRow([
        `Rodada ${p.rodada || ""}`,
        dupla1 || "—",
        "vs",
        dupla2 || "—",
        "",
      ]);
      this.estilizarLinha(row, rowNum);
      rowNum++;
    }

    this.ajustarColunas(worksheet);
  }

  /**
   * TEAMS: confrontos por grupo
   */
  private async gerarSumulaTeams(workbook: ExcelJS.Workbook, etapaId: string, arenaId: string) {
    const confrontoEquipeRepo = new ConfrontoEquipeRepository();
    const confrontos = await confrontoEquipeRepo.buscarPorEtapa(etapaId, arenaId);

    const confrontosGrupos = (confrontos as any[])
      .filter((c) => c.fase === "grupos")
      .sort((a, b) => (a.rodada || 0) - (b.rodada || 0));

    const worksheet = workbook.addWorksheet("Súmula - Fase de Grupos");
    this.aplicarEstiloHeader(worksheet, [
      "Grupo", "Rodada", "Equipe 1", "vs", "Equipe 2", "Placar"
    ]);

    let rowNum = 2;
    for (const c of confrontosGrupos) {
      const row = worksheet.addRow([
        c.grupoNome || "—",
        `Rodada ${c.rodada || ""}`,
        c.equipe1Nome || "—",
        "vs",
        c.equipe2Nome || "—",
        "",
      ]);
      this.estilizarLinha(row, rowNum);
      rowNum++;
    }

    this.ajustarColunas(worksheet);
  }

  // ============== HELPERS ==============

  private aplicarEstiloHeader(worksheet: ExcelJS.Worksheet, headers: string[]) {
    worksheet.addRow(headers);
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 28;
  }

  private estilizarLinha(row: ExcelJS.Row, rowNum: number) {
    const bgColor = rowNum % 2 === 0 ? "FFF9FAFB" : "FFFFFFFF";
    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: bgColor },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
      };
    });
  }

  private ajustarColunas(worksheet: ExcelJS.Worksheet) {
    worksheet.columns.forEach((column) => {
      let maxLength = 10;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const cellLength = cell.value ? String(cell.value).length : 0;
        if (cellLength > maxLength) maxLength = cellLength;
      });
      column.width = Math.min(maxLength + 4, 40);
    });
  }
}

export default new ExcelSumulaService();
