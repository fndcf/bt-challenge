/**
 * Responsabilidade única: Gerenciar lógica de negócio da criação de etapas
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CriarEtapaDTO, FormatoEtapa } from "@/types/etapa";
import { TipoChaveamentoReiDaPraia } from "@/types/reiDaPraia";
import { GeneroJogador, NivelJogador } from "@/types/jogador";
import { getEtapaService } from "@/services";

export interface CriarEtapaFormData extends CriarEtapaDTO {
  tipoChaveamento?: TipoChaveamentoReiDaPraia;
}

export interface DistribuicaoDuplaFixa {
  qtdGrupos: number;
  distribuicao: number[];
  descricao: string;
  totalDuplas: number;
  valido: boolean;
}

export interface DistribuicaoReiDaPraia {
  qtdGrupos: number;
  jogadoresPorGrupo: number;
  totalJogadores: number;
  descricao: string;
  partidasPorGrupo: number;
  valido: boolean;
}

export interface ErrosDatas {
  dataInicio?: string;
  dataFim?: string;
  dataRealizacao?: string;
}

export interface UseCriarEtapaReturn {
  // Estado
  loading: boolean;
  error: string | null;
  errosDatas: ErrosDatas;
  formData: CriarEtapaFormData;

  // Cálculos
  infoDuplaFixa: DistribuicaoDuplaFixa;
  infoReiDaPraia: DistribuicaoReiDaPraia;
  infoAtual: DistribuicaoDuplaFixa | DistribuicaoReiDaPraia;

  // Funções
  handleChange: (field: keyof CriarEtapaFormData, value: any) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

const INITIAL_FORM_DATA: CriarEtapaFormData = {
  nome: "",
  descricao: "",
  nivel: NivelJogador.INTERMEDIARIO,
  genero: GeneroJogador.MASCULINO,
  formato: FormatoEtapa.DUPLA_FIXA,
  tipoChaveamento: TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES,
  dataInicio: "",
  dataFim: "",
  dataRealizacao: "",
  local: "",
  maxJogadores: 16,
  jogadoresPorGrupo: 3,
  contaPontosRanking: true, // Por padrão, etapas contam pontos no ranking
};

export const useCriarEtapa = (): UseCriarEtapaReturn => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errosDatas, setErrosDatas] = useState<ErrosDatas>({});
  const [formData, setFormData] =
    useState<CriarEtapaFormData>(INITIAL_FORM_DATA);

  // ============== CÁLCULOS DE DISTRIBUIÇÃO ==============

  const calcularDistribuicaoDuplaFixa =
    useCallback((): DistribuicaoDuplaFixa => {
      if (
        !formData.maxJogadores ||
        isNaN(formData.maxJogadores) ||
        formData.maxJogadores < 4
      ) {
        return {
          qtdGrupos: 0,
          distribuicao: [],
          descricao: "Informe o número de jogadores (mínimo 4)",
          totalDuplas: 0,
          valido: false,
        };
      }

      if (formData.maxJogadores % 2 !== 0) {
        return {
          qtdGrupos: 0,
          distribuicao: [],
          descricao: "Número de jogadores deve ser par",
          totalDuplas: 0,
          valido: false,
        };
      }

      const totalDuplas = Math.floor(formData.maxJogadores / 2);

      if (totalDuplas < 3) {
        return {
          qtdGrupos: 0,
          distribuicao: [],
          descricao: "Mínimo de 6 jogadores (3 duplas) necessário",
          totalDuplas: 0,
          valido: false,
        };
      }

      if (totalDuplas === 5) {
        return {
          qtdGrupos: 1,
          distribuicao: [5],
          descricao: "Grupo 1: 5 duplas",
          totalDuplas: 5,
          valido: true,
        };
      }

      const gruposBase = Math.floor(totalDuplas / 3);
      const duplasRestantes = totalDuplas % 3;

      const distribuicao: number[] = [];

      for (let i = 0; i < gruposBase; i++) {
        distribuicao.push(3);
      }

      if (duplasRestantes > 0) {
        for (let i = 0; i < duplasRestantes; i++) {
          const index = distribuicao.length - 1 - i;
          if (index >= 0) {
            distribuicao[index]++;
          }
        }
      }

      const qtdGrupos = distribuicao.length;

      const descricaoGrupos = distribuicao
        .map((duplas, i) => `Grupo ${i + 1}: ${duplas} duplas`)
        .join(" | ");

      return {
        qtdGrupos,
        distribuicao,
        descricao: descricaoGrupos,
        totalDuplas,
        valido: true,
      };
    }, [formData.maxJogadores]);

  const calcularDistribuicaoReiDaPraia =
    useCallback((): DistribuicaoReiDaPraia => {
      if (
        !formData.maxJogadores ||
        isNaN(formData.maxJogadores) ||
        formData.maxJogadores < 8
      ) {
        return {
          qtdGrupos: 0,
          jogadoresPorGrupo: 4,
          totalJogadores: 0,
          descricao: "Informe o número de jogadores (mínimo 8)",
          partidasPorGrupo: 3,
          valido: false,
        };
      }

      if (formData.maxJogadores % 4 !== 0) {
        return {
          qtdGrupos: 0,
          jogadoresPorGrupo: 4,
          totalJogadores: formData.maxJogadores,
          descricao: "Número de jogadores deve ser múltiplo de 4",
          partidasPorGrupo: 3,
          valido: false,
        };
      }

      const qtdGrupos = formData.maxJogadores / 4;
      const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

      const descricaoGrupos = Array.from({ length: qtdGrupos })
        .map((_, i) => `Grupo ${letras[i]}: 4 jogadores`)
        .join(" | ");

      return {
        qtdGrupos,
        jogadoresPorGrupo: 4,
        totalJogadores: formData.maxJogadores,
        descricao: descricaoGrupos,
        partidasPorGrupo: 3,
        valido: true,
      };
    }, [formData.maxJogadores]);

  const infoDuplaFixa = calcularDistribuicaoDuplaFixa();
  const infoReiDaPraia = calcularDistribuicaoReiDaPraia();

  const infoAtual =
    formData.formato === FormatoEtapa.REI_DA_PRAIA
      ? infoReiDaPraia
      : infoDuplaFixa;

  // ============== VALIDAÇÕES ==============

  const validarDatas = useCallback((): boolean => {
    const erros: ErrosDatas = {};

    if (formData.dataInicio && formData.dataFim && formData.dataRealizacao) {
      const inicio = new Date(formData.dataInicio);
      const fim = new Date(formData.dataFim);
      const realizacao = new Date(formData.dataRealizacao);

      if (inicio >= fim) {
        erros.dataFim = "Data fim deve ser após a data de início";
      }

      if (fim >= realizacao) {
        erros.dataRealizacao =
          "Data de realização deve ser após o fim das inscrições";
      }

      if (inicio >= realizacao) {
        erros.dataRealizacao =
          "Data de realização deve ser após o início das inscrições";
      }
    }

    setErrosDatas(erros);
    return Object.keys(erros).length === 0;
  }, [formData.dataInicio, formData.dataFim, formData.dataRealizacao]);

  // Efeito para validar datas quando mudarem
  useEffect(() => {
    if (formData.dataInicio || formData.dataFim || formData.dataRealizacao) {
      validarDatas();
    }
  }, [
    formData.dataInicio,
    formData.dataFim,
    formData.dataRealizacao,
    validarDatas,
  ]);

  // Efeito para auto-ajustar maxJogadores APENAS quando formato mudar
  useEffect(() => {
    const currentMax = formData.maxJogadores;

    if (formData.formato === FormatoEtapa.REI_DA_PRAIA) {
      // Rei da Praia: mínimo 8, máximo 64, múltiplo de 4
      if (currentMax < 8) {
        setFormData((prev) => ({ ...prev, maxJogadores: 8 }));
      } else if (currentMax > 64) {
        setFormData((prev) => ({ ...prev, maxJogadores: 64 }));
      } else if (currentMax % 4 !== 0) {
        const ajustado = Math.min(Math.ceil(currentMax / 4) * 4, 64);
        setFormData((prev) => ({ ...prev, maxJogadores: ajustado }));
      }
    } else {
      // Dupla Fixa: mínimo 6, máximo 52, par
      if (currentMax < 6) {
        setFormData((prev) => ({ ...prev, maxJogadores: 6 }));
      } else if (currentMax > 52) {
        setFormData((prev) => ({ ...prev, maxJogadores: 52 }));
      } else if (currentMax % 2 !== 0) {
        const ajustado = Math.min(currentMax + 1, 52);
        setFormData((prev) => ({ ...prev, maxJogadores: ajustado }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.formato]); // Apenas quando formato mudar!

  // ============== HANDLERS ==============

  const handleChange = useCallback(
    (field: keyof CriarEtapaFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        setLoading(true);
        setError(null);

        // Validar datas
        if (!validarDatas()) {
          setError("Corrija os erros nas datas antes de continuar");
          setLoading(false);
          return;
        }

        // Validar formato Rei da Praia
        if (formData.formato === FormatoEtapa.REI_DA_PRAIA) {
          if (formData.maxJogadores < 8) {
            setError("Rei da Praia necessita de no mínimo 8 jogadores");
            setLoading(false);
            return;
          }
          if (formData.maxJogadores > 64) {
            setError("Rei da Praia: máximo de 64 jogadores");
            setLoading(false);
            return;
          }
          if (formData.maxJogadores % 4 !== 0) {
            setError(
              "Rei da Praia: número de jogadores deve ser múltiplo de 4"
            );
            setLoading(false);
            return;
          }
        } else {
          // Validar formato Dupla Fixa
          if (formData.maxJogadores < 6) {
            setError("Dupla Fixa necessita de no mínimo 6 jogadores");
            setLoading(false);
            return;
          }
          if (formData.maxJogadores > 52) {
            setError("Dupla Fixa: máximo de 52 jogadores");
            setLoading(false);
            return;
          }
          if (formData.maxJogadores % 2 !== 0) {
            setError("Dupla Fixa: número de jogadores deve ser par");
            setLoading(false);
            return;
          }
        }

        // Validar nome
        if (formData.nome.length < 3) {
          setError("Nome deve ter no mínimo 3 caracteres");
          setLoading(false);
          return;
        }

        // Calcular jogadoresPorGrupo
        let jogadoresPorGrupoCalculado = 3;

        if (formData.formato === FormatoEtapa.REI_DA_PRAIA) {
          jogadoresPorGrupoCalculado = 4;
        } else {
          const totalDuplas = Math.floor(formData.maxJogadores / 2);
          jogadoresPorGrupoCalculado = Math.ceil(
            totalDuplas / infoDuplaFixa.qtdGrupos
          );
        }

        // Formatar datas para ISO
        const dadosFormatados: any = {
          ...formData,
          dataInicio: formData.dataInicio
            ? new Date(formData.dataInicio + "T00:00:00").toISOString()
            : "",
          dataFim: formData.dataFim
            ? new Date(formData.dataFim + "T23:59:59").toISOString()
            : "",
          dataRealizacao: formData.dataRealizacao
            ? new Date(formData.dataRealizacao + "T00:00:00").toISOString()
            : "",
          jogadoresPorGrupo: jogadoresPorGrupoCalculado,
        };

        // Incluir tipoChaveamento apenas se for Rei da Praia
        if (formData.formato === FormatoEtapa.REI_DA_PRAIA) {
          dadosFormatados.tipoChaveamento = formData.tipoChaveamento;
        } else {
          delete dadosFormatados.tipoChaveamento;
        }

        const etapaService = getEtapaService();
        await etapaService.criar(dadosFormatados);
        navigate("/admin/etapas");
      } catch (err: any) {
        setError(err.message || "Erro ao criar etapa");
        setLoading(false);
      }
    },
    [formData, validarDatas, infoDuplaFixa.qtdGrupos, navigate]
  );

  return {
    // Estado
    loading,
    error,
    errosDatas,
    formData,

    // Cálculos
    infoDuplaFixa,
    infoReiDaPraia,
    infoAtual,

    // Funções
    handleChange,
    handleSubmit,
  };
};
