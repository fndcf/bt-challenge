/**
 * Service para importação e exportação de jogadores via Excel
 */

import ExcelJS from "exceljs";
import {
  Jogador,
  NivelJogador,
  StatusJogador,
  GeneroJogador,
  CriarJogadorDTO,
} from "../models/Jogador";
import jogadorService from "./JogadorService";
import logger from "../utils/logger";

// Mapeamento de valores aceitos para enums
const GENERO_MAP: Record<string, GeneroJogador> = {
  masculino: GeneroJogador.MASCULINO,
  m: GeneroJogador.MASCULINO,
  feminino: GeneroJogador.FEMININO,
  f: GeneroJogador.FEMININO,
};

const NIVEL_MAP: Record<string, NivelJogador> = {
  iniciante: NivelJogador.INICIANTE,
  intermediario: NivelJogador.INTERMEDIARIO,
  "intermediário": NivelJogador.INTERMEDIARIO,
  avancado: NivelJogador.AVANCADO,
  "avançado": NivelJogador.AVANCADO,
};

const GENERO_LABELS: Record<string, string> = {
  [GeneroJogador.MASCULINO]: "Masculino",
  [GeneroJogador.FEMININO]: "Feminino",
};

const NIVEL_LABELS: Record<string, string> = {
  [NivelJogador.INICIANTE]: "Iniciante",
  [NivelJogador.INTERMEDIARIO]: "Intermediário",
  [NivelJogador.AVANCADO]: "Avançado",
};

const STATUS_LABELS: Record<string, string> = {
  [StatusJogador.ATIVO]: "Ativo",
  [StatusJogador.INATIVO]: "Inativo",
  [StatusJogador.SUSPENSO]: "Suspenso",
};

// Mapeamento de headers para campos
const HEADER_MAP: Record<string, string> = {
  "nome completo": "nome",
  "nome": "nome",
  "email": "email",
  "telefone": "telefone",
  "data de nascimento": "dataNascimento",
  "data nascimento": "dataNascimento",
  "genero": "genero",
  "gênero": "genero",
  "nivel": "nivel",
  "nível": "nivel",
  "status": "status",
  "observacoes": "observacoes",
  "observações": "observacoes",
};

class ExcelJogadorService {
  /**
   * Exportar jogadores para Excel
   */
  async exportarParaExcel(arenaId: string): Promise<Buffer> {
    const resultado = await jogadorService.listar({
      arenaId,
      limite: 10000,
      offset: 0,
      ordenarPor: "nome",
      ordem: "asc",
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Dupley";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Jogadores");

    // Colunas
    worksheet.columns = [
      { header: "Nome Completo", key: "nome", width: 30 },
      { header: "Email", key: "email", width: 25 },
      { header: "Telefone", key: "telefone", width: 18 },
      { header: "Data de Nascimento", key: "dataNascimento", width: 18 },
      { header: "Genero", key: "genero", width: 12 },
      { header: "Nivel", key: "nivel", width: 15 },
      { header: "Status", key: "status", width: 12 },
      { header: "Observacoes", key: "observacoes", width: 35 },
    ];

    // Estilo do header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 25;

    // Dados
    for (const jogador of resultado.jogadores) {
      worksheet.addRow({
        nome: jogador.nome,
        email: jogador.email || "",
        telefone: jogador.telefone || "",
        dataNascimento: jogador.dataNascimento || "",
        genero: GENERO_LABELS[jogador.genero] || jogador.genero,
        nivel: NIVEL_LABELS[jogador.nivel] || jogador.nivel,
        status: STATUS_LABELS[jogador.status] || jogador.status,
        observacoes: jogador.observacoes || "",
      });
    }

    // Auto-filtro
    worksheet.autoFilter = {
      from: "A1",
      to: `H${resultado.jogadores.length + 1}`,
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Importar jogadores de Excel
   */
  async importarDeExcel(
    arenaId: string,
    adminUid: string,
    fileBuffer: Buffer
  ): Promise<{ criados: number; jogadores: Jogador[] }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as unknown as ArrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error("Planilha vazia ou formato inválido");
    }

    // Mapear headers
    const headerRow = worksheet.getRow(1);
    const columnMap: Record<number, string> = {};
    const foundHeaders: string[] = [];

    headerRow.eachCell((cell, colNumber) => {
      const headerText = String(cell.value || "").trim().toLowerCase();
      const fieldName = HEADER_MAP[headerText];
      if (fieldName) {
        columnMap[colNumber] = fieldName;
        foundHeaders.push(fieldName);
      }
    });

    // Validar colunas obrigatórias
    const requiredFields = ["nome", "genero", "nivel"];
    const missingFields = requiredFields.filter(
      (f) => !foundHeaders.includes(f)
    );

    if (missingFields.length > 0) {
      const labels: Record<string, string> = {
        nome: "Nome Completo",
        genero: "Genero",
        nivel: "Nivel",
      };
      const missing = missingFields.map((f) => labels[f] || f).join(", ");
      throw new Error(`Colunas obrigatórias ausentes: ${missing}`);
    }

    // Ler dados das linhas
    const rows: Array<{ rowNumber: number; data: Record<string, string> }> = [];
    const errors: string[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Pular header

      const data: Record<string, string> = {};
      let hasData = false;

      row.eachCell((cell, colNumber) => {
        const fieldName = columnMap[colNumber];
        if (fieldName) {
          const value = String(cell.value || "").trim();
          if (value) {
            data[fieldName] = value;
            hasData = true;
          }
        }
      });

      if (hasData) {
        rows.push({ rowNumber, data });
      }
    });

    if (rows.length === 0) {
      throw new Error("Planilha não contém dados. Adicione jogadores a partir da linha 2.");
    }

    // Validar cada linha
    const jogadoresParaCriar: CriarJogadorDTO[] = [];

    for (const { rowNumber, data } of rows) {
      // Nome
      const nome = data.nome;
      if (!nome || nome.length < 3) {
        errors.push(`Linha ${rowNumber}: Nome deve ter no mínimo 3 caracteres`);
        continue;
      }
      if (nome.length > 100) {
        errors.push(`Linha ${rowNumber}: Nome deve ter no máximo 100 caracteres`);
        continue;
      }

      // Genero
      const generoInput = (data.genero || "").toLowerCase();
      const genero = GENERO_MAP[generoInput];
      if (!genero) {
        errors.push(
          `Linha ${rowNumber}: Gênero inválido "${data.genero}". Use: Masculino, Feminino, M ou F`
        );
        continue;
      }

      // Nivel
      const nivelInput = (data.nivel || "").toLowerCase();
      const nivel = NIVEL_MAP[nivelInput];
      if (!nivel) {
        errors.push(
          `Linha ${rowNumber}: Nível inválido "${data.nivel}". Use: Iniciante, Intermediário ou Avançado`
        );
        continue;
      }

      // Email (opcional)
      const email = data.email || "";
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push(`Linha ${rowNumber}: Email inválido "${email}"`);
        continue;
      }

      // Data de nascimento (opcional)
      const dataNascimento = data.dataNascimento || "";
      if (dataNascimento && !/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) {
        errors.push(
          `Linha ${rowNumber}: Data de nascimento inválida "${dataNascimento}". Use formato: YYYY-MM-DD`
        );
        continue;
      }

      // Observacoes
      const observacoes = data.observacoes || "";
      if (observacoes.length > 500) {
        errors.push(`Linha ${rowNumber}: Observações devem ter no máximo 500 caracteres`);
        continue;
      }

      jogadoresParaCriar.push({
        nome,
        genero,
        nivel,
        status: StatusJogador.ATIVO,
        email: email || undefined,
        telefone: data.telefone || undefined,
        dataNascimento: dataNascimento || undefined,
        observacoes: observacoes || undefined,
      });
    }

    if (errors.length > 0) {
      throw new Error(`Erros de validação:\n${errors.join("\n")}`);
    }

    // Verificar duplicatas dentro da planilha
    const nomesNaPlanilha = jogadoresParaCriar.map((j) =>
      j.nome.trim().toLowerCase()
    );
    const nomesUnicos = new Set<string>();
    const duplicatasInternas: string[] = [];

    for (const nome of nomesNaPlanilha) {
      if (nomesUnicos.has(nome)) {
        duplicatasInternas.push(nome);
      }
      nomesUnicos.add(nome);
    }

    if (duplicatasInternas.length > 0) {
      const nomes = [...new Set(duplicatasInternas)]
        .map((n) => jogadoresParaCriar.find((j) => j.nome.trim().toLowerCase() === n)?.nome || n)
        .join(", ");
      throw new Error(`Nomes duplicados na planilha: ${nomes}`);
    }

    // Verificar duplicatas com banco de dados
    const existentes = await jogadorService.listar({
      arenaId,
      limite: 10000,
      offset: 0,
    });

    const nomesExistentes = new Set(
      existentes.jogadores.map((j) => j.nome.trim().toLowerCase())
    );

    const duplicatasComBanco = jogadoresParaCriar.filter((j) =>
      nomesExistentes.has(j.nome.trim().toLowerCase())
    );

    if (duplicatasComBanco.length > 0) {
      const nomes = duplicatasComBanco.map((j) => j.nome).join(", ");
      throw new Error(
        `Os seguintes jogadores já existem na arena: ${nomes}`
      );
    }

    // Criar jogadores
    const jogadoresCriados: Jogador[] = [];

    for (const dados of jogadoresParaCriar) {
      const jogador = await jogadorService.criar(arenaId, adminUid, dados);
      jogadoresCriados.push(jogador);
    }

    logger.info("Jogadores importados via Excel", {
      arenaId,
      total: jogadoresCriados.length,
    });

    return {
      criados: jogadoresCriados.length,
      jogadores: jogadoresCriados,
    };
  }
}

export default new ExcelJogadorService();
