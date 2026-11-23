/**
 * Responsabilidade única: Gerenciar lógica de negócio da edição de etapas
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Etapa,
  AtualizarEtapaDTO,
  FormatoEtapa,
  TipoFormacaoDupla,
  TipoFormacaoEquipe,
  VarianteSuperX,
  VarianteTeams,
} from "@/types/etapa";
import { GeneroJogador } from "@/types/jogador";
import { MAX_EQUIPES_TEAMS } from "@/utils/etapa";
import { getEtapaService } from "@/services";
import { format } from "date-fns";
import { getMensagemErro } from "@/utils/erro";

export interface UseEditarEtapaReturn {
  // Estado da Etapa
  etapa: Etapa | null;
  loading: boolean;
  salvando: boolean;
  error: string | null;
  globalLoading: boolean;
  globalLoadingMessage: string;

  // Estado do Formulário
  formData: AtualizarEtapaDTO;

  // Info Computada
  isReiDaPraia: boolean;
  isSuperX: boolean;
  isTeams: boolean;
  temInscritos: boolean;
  chavesGeradas: boolean;

  // Funções
  handleChange: <K extends keyof AtualizarEtapaDTO>(
    field: K,
    value: AtualizarEtapaDTO[K]
  ) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  calcularMinimoJogadores: () => number;
  ajustarValorJogadores: (valor: number) => number;
  /** Super X: o número de jogadores acompanha a variante */
  alterarVarianteSuperX: (variante: VarianteSuperX) => void;
  /** Teams: ajusta o número de jogadores ao múltiplo da nova variante */
  alterarVarianteTeams: (variante: VarianteTeams) => void;
}

/** Mínimo de jogadores do formato, sem contar os inscritos */
const minimoDoFormato = (formato: FormatoEtapa | undefined, varianteTeams: number) => {
  if (formato === FormatoEtapa.TEAMS) return varianteTeams * 2;
  if (formato === FormatoEtapa.REI_DA_PRAIA) return 8;
  return 6;
};

/** Passo do número de jogadores (múltiplo exigido) */
const passoDoFormato = (formato: FormatoEtapa | undefined, varianteTeams: number) => {
  if (formato === FormatoEtapa.TEAMS) return varianteTeams;
  if (formato === FormatoEtapa.REI_DA_PRAIA) return 4;
  return 2;
};

const arredondarPara = (valor: number, passo: number) =>
  Math.ceil(valor / passo) * passo;

export const useEditarEtapa = (
  id: string | undefined
): UseEditarEtapaReturn => {
  const navigate = useNavigate();

  const [etapa, setEtapa] = useState<Etapa | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalLoadingMessage, setGlobalLoadingMessage] = useState("");

  const [formData, setFormData] = useState<AtualizarEtapaDTO>({
    nome: "",
    descricao: "",
    nivel: undefined,
    genero: undefined,
    dataInicio: "",
    dataFim: "",
    dataRealizacao: "",
    local: "",
    maxJogadores: 16,
    tipoChaveamento: undefined,
    contaPontosRanking: true,
    darPontosParticipacao: true,
    melhorDe3: false,
    melhorDe3Eliminatoria: false,
    tipoFormacaoJogos: undefined, // TEAMS
  });

  // ============== INFO COMPUTADA ==============

  const isReiDaPraia = etapa?.formato === FormatoEtapa.REI_DA_PRAIA;
  const isSuperX = etapa?.formato === FormatoEtapa.SUPER_X;
  const isTeams = etapa?.formato === FormatoEtapa.TEAMS;
  const temInscritos = (etapa?.totalInscritos || 0) > 0;
  const chavesGeradas = etapa?.chavesGeradas || false;

  // Variantes escolhidas no formulário (podem mudar antes das chaves)
  const varianteTeams = formData.varianteTeams || etapa?.varianteTeams || 4;
  const varianteSuperX = formData.varianteSuperX || etapa?.varianteSuperX || 8;

  // ============== CARREGAR ETAPA ==============

  // A API pode devolver texto ou o Timestamp do Firestore
  const toInputDate = useCallback(
    (data: string | { _seconds: number }): string => {
      if (!data) return "";
      return format(
        typeof data === "string" ? new Date(data) : new Date(data._seconds * 1000),
        "yyyy-MM-dd"
      );
    },
    []
  );

  const carregarEtapa = useCallback(async () => {
    try {
      setLoading(true);
      if (!id) {
        setError("ID da etapa não informado");
        return;
      }

      const etapaService = getEtapaService();
      const data = await etapaService.buscarPorId(id);
      setEtapa(data);

      setFormData({
        nome: data.nome,
        descricao: data.descricao || "",
        nivel: data.nivel,
        genero: data.genero,
        dataInicio: toInputDate(data.dataInicio),
        dataFim: toInputDate(data.dataFim),
        dataRealizacao: toInputDate(data.dataRealizacao),
        local: data.local || "",
        maxJogadores: data.maxJogadores || 16,
        tipoChaveamento: data.tipoChaveamento,
        contaPontosRanking: data.contaPontosRanking ?? true,
        darPontosParticipacao: data.darPontosParticipacao ?? true,
        melhorDe3: data.melhorDe3 ?? false,
        melhorDe3Eliminatoria: data.melhorDe3Eliminatoria ?? false,
        // Campos de cada formato
        tipoFormacaoDupla: data.tipoFormacaoDupla,
        grupoUnico: data.grupoUnico ?? false,
        varianteSuperX: data.varianteSuperX,
        varianteTeams: data.varianteTeams,
        tipoFormacaoEquipe: data.tipoFormacaoEquipe,
        tipoFormacaoJogos: data.tipoFormacaoJogos,
      });
    } catch (err) {
      setError(getMensagemErro(err, "Erro ao carregar etapa"));
    } finally {
      setLoading(false);
    }
  }, [id, toInputDate]);

  useEffect(() => {
    carregarEtapa();
  }, [carregarEtapa]);

  // ============== CÁLCULOS ==============

  const calcularMinimoJogadores = useCallback((): number => {
    if (!etapa) return 6;

    // Super X: jogadores são fixos pela variante
    if (isSuperX) return varianteSuperX;

    const minimo = Math.max(
      minimoDoFormato(etapa.formato, varianteTeams),
      etapa.totalInscritos || 0
    );
    return arredondarPara(minimo, passoDoFormato(etapa.formato, varianteTeams));
  }, [etapa, isSuperX, varianteSuperX, varianteTeams]);

  const ajustarValorJogadores = useCallback(
    (valor: number): number => {
      const minimo = calcularMinimoJogadores();

      // Super X: não permite ajuste, é fixo pela variante
      if (isSuperX) return minimo;
      if (valor < minimo) return minimo;

      return arredondarPara(valor, passoDoFormato(etapa?.formato, varianteTeams));
    },
    [calcularMinimoJogadores, etapa, isSuperX, varianteTeams]
  );

  // ============== HANDLERS ==============

  const handleChange = useCallback(
    <K extends keyof AtualizarEtapaDTO>(
      field: K,
      value: AtualizarEtapaDTO[K]
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const alterarVarianteSuperX = useCallback((variante: VarianteSuperX) => {
    setFormData((prev) => ({
      ...prev,
      varianteSuperX: variante,
      maxJogadores: variante,
    }));
  }, []);

  const alterarVarianteTeams = useCallback(
    (variante: VarianteTeams) => {
      const inscritos = etapa?.totalInscritos || 0;
      setFormData((prev) => {
        const minimo = Math.max(variante * 2, inscritos, prev.maxJogadores || 0);
        return {
          ...prev,
          varianteTeams: variante,
          maxJogadores: Math.min(
            arredondarPara(minimo, variante),
            variante * MAX_EQUIPES_TEAMS
          ),
        };
      });
    },
    [etapa]
  );

  /** Mensagem de erro do formulário, ou null se pode salvar */
  const validar = useCallback((): string | null => {
    if (!etapa) return null;
    const max = formData.maxJogadores;
    const inscritos = etapa.totalInscritos || 0;

    if (!max) return "Número máximo de jogadores é obrigatório";

    if (isSuperX) {
      if (inscritos > varianteSuperX) {
        return `Super ${varianteSuperX} aceita ${varianteSuperX} jogadores e a etapa já tem ${inscritos} inscritos`;
      }
      if (max !== varianteSuperX) {
        return `Super ${varianteSuperX}: número de jogadores deve ser exatamente ${varianteSuperX}`;
      }
    } else if (isReiDaPraia) {
      if (max < 8) return "Rei da Praia requer mínimo de 8 jogadores";
      if (max > 64) return "Rei da Praia: máximo de 64 jogadores";
      if (max % 4 !== 0) return "Rei da Praia: número de jogadores deve ser múltiplo de 4";
    } else if (isTeams) {
      const minimo = varianteTeams * 2; // Mínimo de 2 equipes
      const maximo = varianteTeams * MAX_EQUIPES_TEAMS;
      if (max < minimo) {
        return `Teams ${varianteTeams}: mínimo de ${minimo} jogadores (2 equipes)`;
      }
      if (max > maximo) {
        return `Teams ${varianteTeams}: máximo de ${maximo} jogadores (${MAX_EQUIPES_TEAMS} equipes)`;
      }
      if (max % varianteTeams !== 0) {
        return `Teams ${varianteTeams}: número de jogadores deve ser múltiplo de ${varianteTeams}`;
      }
    } else {
      if (max < 6) return "Dupla Fixa: mínimo de 6 jogadores";
      if (max > 52) return "Dupla Fixa: máximo de 52 jogadores";
      if (max % 2 !== 0) return "Dupla Fixa: número de jogadores deve ser par";
    }

    if (max < inscritos) {
      return `Não é possível reduzir para ${max}. Já existem ${inscritos} jogador(es) inscrito(s).`;
    }

    // "Mesmo nível" precisa saber qual nível
    const semNivel = !formData.nivel;
    const mista = formData.genero === GeneroJogador.MISTO;
    if (
      semNivel &&
      !mista &&
      etapa.formato === FormatoEtapa.DUPLA_FIXA &&
      formData.tipoFormacaoDupla === TipoFormacaoDupla.MESMO_NIVEL
    ) {
      return "Formação por mesmo nível precisa de um nível na etapa";
    }
    if (
      semNivel &&
      isTeams &&
      formData.tipoFormacaoEquipe === TipoFormacaoEquipe.MESMO_NIVEL
    ) {
      return "Equipes por mesmo nível precisam de um nível na etapa";
    }

    if (!formData.nome || formData.nome.length < 3) {
      return "Nome deve ter no mínimo 3 caracteres";
    }

    return null;
  }, [etapa, formData, isReiDaPraia, isSuperX, isTeams, varianteSuperX, varianteTeams]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!id || !etapa) return;

      const erro = validar();
      if (erro) {
        setError(erro);
        return;
      }

      try {
        setSalvando(true);
        setError(null);
        setGlobalLoading(true);
        setGlobalLoadingMessage("Salvando alterações...");

        const toISO = (dateStr: string) => {
          if (!dateStr) return undefined;
          return new Date(`${dateStr}T12:00:00Z`).toISOString();
        };

        const dadosParaEnviar = {
          ...formData,
          // Converter nivel undefined para null (para "Todos os níveis")
          // null é enviado explicitamente para o backend remover o campo
          nivel: formData.nivel === undefined ? null : formData.nivel,
          dataInicio: formData.dataInicio
            ? toISO(formData.dataInicio)
            : undefined,
          dataFim: formData.dataFim ? toISO(formData.dataFim) : undefined,
          dataRealizacao: formData.dataRealizacao
            ? toISO(formData.dataRealizacao)
            : undefined,
        };

        const etapaService = getEtapaService();
        await etapaService.atualizar(id, dadosParaEnviar);
        navigate(`/admin/etapas/${id}`);
      } catch (err) {
        setError(getMensagemErro(err, "Erro ao atualizar etapa"));
        setSalvando(false);
      } finally {
        setGlobalLoading(false);
        setGlobalLoadingMessage("");
      }
    },
    [id, etapa, formData, validar, navigate]
  );

  return {
    // Estado da Etapa
    etapa,
    loading,
    salvando,
    error,
    globalLoading,
    globalLoadingMessage,

    // Estado do Formulário
    formData,

    // Info Computada
    isReiDaPraia,
    isSuperX,
    isTeams,
    temInscritos,
    chavesGeradas,

    // Funções
    handleChange,
    handleSubmit,
    calcularMinimoJogadores,
    ajustarValorJogadores,
    alterarVarianteSuperX,
    alterarVarianteTeams,
  };
};
