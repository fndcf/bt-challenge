/**
 * Responsabilidade única: Gerenciar lógica de negócio da edição de etapas
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Etapa, AtualizarEtapaDTO, FormatoEtapa } from "@/types/etapa";
import { getEtapaService } from "@/services";
import { format } from "date-fns";

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
  handleChange: (field: keyof AtualizarEtapaDTO, value: any) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  calcularMinimoJogadores: () => number;
  ajustarValorJogadores: (valor: number) => number;
}

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
    tipoFormacaoJogos: undefined, // TEAMS
  });

  // ============== INFO COMPUTADA ==============

  const isReiDaPraia = etapa?.formato === FormatoEtapa.REI_DA_PRAIA;
  const isSuperX = etapa?.formato === FormatoEtapa.SUPER_X;
  const isTeams = etapa?.formato === FormatoEtapa.TEAMS;
  const temInscritos = (etapa?.totalInscritos || 0) > 0;
  const chavesGeradas = etapa?.chavesGeradas || false;

  // ============== CARREGAR ETAPA ==============

  const toInputDate = useCallback((timestamp: any): string => {
    if (!timestamp) return "";
    const date = timestamp._seconds
      ? new Date(timestamp._seconds * 1000)
      : new Date(timestamp);
    return format(date, "yyyy-MM-dd");
  }, []);

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
        varianteSuperX: data.varianteSuperX,
        contaPontosRanking: data.contaPontosRanking ?? true,
        tipoFormacaoJogos: data.tipoFormacaoJogos, // TEAMS
      });
    } catch (err: any) {
      setError(err.message || "Erro ao carregar etapa");
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
    if (isSuperX) {
      return etapa.varianteSuperX || 8;
    }

    // TEAMS: mínimo baseado na variante (4 ou 6) * 2 equipes
    if (isTeams) {
      const variante = etapa.varianteTeams || 4;
      const minimoFormato = variante * 2;
      const minimoInscritos = etapa.totalInscritos || 0;
      const minimo = Math.max(minimoFormato, minimoInscritos);
      // Arredondar para múltiplo da variante
      return Math.ceil(minimo / variante) * variante;
    }

    const minimoFormato = isReiDaPraia ? 8 : 6;
    const minimoInscritos = etapa.totalInscritos || 0;
    const minimo = Math.max(minimoFormato, minimoInscritos);

    if (isReiDaPraia) {
      // Arredondar para cima para múltiplo de 4
      return Math.ceil(minimo / 4) * 4;
    } else {
      // Arredondar para cima para número par
      return minimo % 2 === 0 ? minimo : minimo + 1;
    }
  }, [etapa, isReiDaPraia, isSuperX, isTeams]);

  const ajustarValorJogadores = useCallback(
    (valor: number): number => {
      const minimo = calcularMinimoJogadores();

      // Super X: não permite ajuste, é fixo pela variante
      if (isSuperX) {
        return minimo;
      }

      if (valor < minimo) {
        return minimo;
      }

      // TEAMS: arredondar para múltiplo da variante
      if (isTeams && etapa) {
        const variante = etapa.varianteTeams || 4;
        return Math.ceil(valor / variante) * variante;
      }

      if (isReiDaPraia) {
        // Arredondar para múltiplo de 4
        return Math.ceil(valor / 4) * 4;
      } else {
        // Arredondar para par
        return valor % 2 === 0 ? valor : valor + 1;
      }
    },
    [calcularMinimoJogadores, etapa, isReiDaPraia, isSuperX, isTeams]
  );

  // ============== HANDLERS ==============

  const handleChange = useCallback(
    (field: keyof AtualizarEtapaDTO, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!id || !etapa) return;

      try {
        setSalvando(true);
        setError(null);
        setGlobalLoading(true);
        setGlobalLoadingMessage("Salvando alterações...");

        if (!formData.maxJogadores) {
          setError("Número máximo de jogadores é obrigatório");
          setSalvando(false);
          return;
        }

        // Validações específicas por formato
        if (isSuperX) {
          // Super X: maxJogadores deve ser igual à variante selecionada
          const variante = etapa.varianteSuperX;
          if (formData.maxJogadores !== variante) {
            setError(
              `Super ${variante}: número de jogadores deve ser exatamente ${variante}`
            );
            setSalvando(false);
            return;
          }
        } else if (isReiDaPraia) {
          if (formData.maxJogadores < 8) {
            setError("Rei da Praia requer mínimo de 8 jogadores");
            setSalvando(false);
            return;
          }

          if (formData.maxJogadores > 64) {
            setError("Rei da Praia: máximo de 64 jogadores");
            setSalvando(false);
            return;
          }

          if (formData.maxJogadores % 4 !== 0) {
            setError(
              "Rei da Praia: número de jogadores deve ser múltiplo de 4"
            );
            setSalvando(false);
            return;
          }
        } else if (isTeams) {
          // TEAMS: validação baseada na variante (4 ou 6 jogadores por equipe)
          const variante = etapa.varianteTeams || 4;
          const minimo = variante * 2; // Mínimo de 2 equipes
          // Máximo: 24 equipes (8 grupos × 3 equipes) = 96 jogadores (TEAMS_4) ou 144 jogadores (TEAMS_6)
          const maximo = variante === 4 ? 96 : 144;

          if (formData.maxJogadores < minimo) {
            setError(`TEAMS ${variante}: mínimo de ${minimo} jogadores (2 equipes)`);
            setSalvando(false);
            return;
          }

          if (formData.maxJogadores > maximo) {
            setError(`TEAMS ${variante}: máximo de ${maximo} jogadores (24 equipes)`);
            setSalvando(false);
            return;
          }

          if (formData.maxJogadores % variante !== 0) {
            setError(
              `TEAMS ${variante}: número de jogadores deve ser múltiplo de ${variante}`
            );
            setSalvando(false);
            return;
          }
        } else {
          // Dupla Fixa
          if (formData.maxJogadores < 6) {
            setError("Dupla Fixa: mínimo de 6 jogadores");
            setSalvando(false);
            return;
          }

          if (formData.maxJogadores > 52) {
            setError("Dupla Fixa: máximo de 52 jogadores");
            setSalvando(false);
            return;
          }

          if (formData.maxJogadores % 2 !== 0) {
            setError("Dupla Fixa: número de jogadores deve ser par");
            setSalvando(false);
            return;
          }
        }

        if (formData.maxJogadores < (etapa.totalInscritos || 0)) {
          setError(
            `Não é possível reduzir para ${formData.maxJogadores}. Já existem ${etapa.totalInscritos} jogador(es) inscrito(s).`
          );
          setSalvando(false);
          return;
        }

        // Validar nome
        if (!formData.nome || formData.nome.length < 3) {
          setError("Nome deve ter no mínimo 3 caracteres");
          setSalvando(false);
          return;
        }

        const toISO = (dateStr: string) => {
          if (!dateStr) return undefined;
          return new Date(`${dateStr}T12:00:00Z`).toISOString();
        };

        const dadosParaEnviar = {
          ...formData,
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
      } catch (err: any) {
        setError(err.message || "Erro ao atualizar etapa");
        setSalvando(false);
      } finally {
        setGlobalLoading(false);
        setGlobalLoadingMessage("");
      }
    },
    [id, etapa, formData, isReiDaPraia, isSuperX, isTeams, navigate]
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
  };
};
