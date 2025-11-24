/**
 * CriarEtapa - VERSÃO ATUALIZADA COM REI DA PRAIA
 * Suporta criação de etapas nos formatos Dupla Fixa e Rei da Praia
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { CriarEtapaDTO, FormatoEtapa } from "../../types/etapa";
import { TipoChaveamentoReiDaPraia } from "../../types/reiDaPraia";
import { GeneroJogador, NivelJogador } from "../../types/jogador";
import etapaService from "../../services/etapaService";
import Footer from "@/components/Footer";

// ============== STYLED COMPONENTS ==============

const Container = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;

  @media (max-width: 768px) {
    gap: 1.5rem;
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
  }
`;

const BackButton = styled.button`
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  transition: color 0.2s;
  padding: 0;

  &:hover {
    color: #111827;
  }
`;

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 0.9375rem;

  @media (max-width: 768px) {
    font-size: 0.875rem;
  }
`;

const ErrorAlert = styled.div`
  margin-bottom: 1.5rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 1rem;
  border-radius: 0.5rem;

  p:first-child {
    font-weight: 500;
    margin: 0 0 0.25rem 0;
  }

  p:last-child {
    font-size: 0.875rem;
    margin: 0;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Card = styled.div<{ $variant?: "purple" }>`
  background: ${(props) => (props.$variant === "purple" ? "#faf5ff" : "white")};
  border-radius: 0.5rem;
  border: 1px solid
    ${(props) => (props.$variant === "purple" ? "#e9d5ff" : "#e5e7eb")};
  padding: 1.5rem;

  @media (max-width: 768px) {
    padding: 1.25rem;
  }
`;

const CardTitle = styled.h2<{ $variant?: "purple" }>`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${(props) => (props.$variant === "purple" ? "#7c3aed" : "#111827")};
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FieldsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
`;

const Input = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  border: 1px solid ${(props) => (props.$hasError ? "#fca5a5" : "#d1d5db")};
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    ring: 2px;
    ring-color: ${(props) => (props.$hasError ? "#ef4444" : "#3b82f6")};
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;

  &:focus {
    outline: none;
    ring: 2px;
    ring-color: #3b82f6;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const Select = styled.select`
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    ring: 2px;
    ring-color: #3b82f6;
  }
`;

const HelperText = styled.p<{ $error?: boolean }>`
  font-size: 0.75rem;
  color: ${(props) => (props.$error ? "#dc2626" : "#6b7280")};
  margin: 0.25rem 0 0 0;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const PreviewCard = styled.div<{ $variant?: "blue" | "purple" }>`
  background: ${(props) =>
    props.$variant === "purple" ? "#f5f3ff" : "#eff6ff"};
  border: 1px solid
    ${(props) => (props.$variant === "purple" ? "#c4b5fd" : "#bfdbfe")};
  border-radius: 0.5rem;
  padding: 1rem;
`;

const PreviewTitle = styled.h3<{ $variant?: "blue" | "purple" }>`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${(props) => (props.$variant === "purple" ? "#6d28d9" : "#1e40af")};
  margin: 0 0 0.5rem 0;
`;

const PreviewContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const PreviewRow = styled.div<{ $variant?: "blue" | "purple" }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: ${(props) => (props.$variant === "purple" ? "#6d28d9" : "#1e40af")};

  strong {
    font-weight: 600;
  }
`;

const PreviewBox = styled.div`
  background: white;
  border-radius: 0.375rem;
  padding: 0.75rem;
  font-size: 0.875rem;
  color: #374151;
`;

const PreviewNote = styled.p<{ $variant?: "blue" | "purple" }>`
  font-size: 0.75rem;
  color: ${(props) => (props.$variant === "purple" ? "#7c3aed" : "#2563eb")};
  margin: 0;
`;

const ButtonsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;

  @media (max-width: 640px) {
    flex-direction: column-reverse;

    button {
      width: 100%;
    }
  }
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" }>`
  padding: 0.5rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) =>
    props.$variant === "primary"
      ? `
    background: #3b82f6;
    color: white;
    border: none;

    &:hover:not(:disabled) {
      background: #2563eb;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `
      : `
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;

    &:hover {
      background: #f9fafb;
    }
  `}
`;

// ============== Seletor de Formato ==============

const FormatoSelector = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const FormatoOption = styled.div<{ $selected: boolean; $color: string }>`
  border: 2px solid ${(props) => (props.$selected ? props.$color : "#e5e7eb")};
  border-radius: 0.75rem;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
  background: ${(props) =>
    props.$selected
      ? props.$color === "#3b82f6"
        ? "#eff6ff"
        : "#f5f3ff"
      : "white"};

  &:hover {
    border-color: ${(props) => props.$color};
  }
`;

const FormatoHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
`;

const FormatoIcon = styled.span`
  font-size: 1.5rem;
`;

const FormatoTitle = styled.h3<{ $selected: boolean }>`
  font-size: 1rem;
  font-weight: 600;
  color: ${(props) => (props.$selected ? "#111827" : "#6b7280")};
  margin: 0;
`;

const FormatoDescription = styled.p`
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
`;

const FormatoBadge = styled.span<{ $color: string }>`
  display: inline-block;
  font-size: 0.6875rem;
  font-weight: 600;
  color: ${(props) => props.$color};
  background: ${(props) =>
    props.$color === "#3b82f6" ? "#dbeafe" : "#ede9fe"};
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  margin-top: 0.5rem;
`;

// ============== NOVO: Seletor de Tipo de Chaveamento ==============

const ChaveamentoSelector = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ChaveamentoOption = styled.div<{ $selected: boolean }>`
  border: 2px solid ${(props) => (props.$selected ? "#7c3aed" : "#e5e7eb")};
  border-radius: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  background: ${(props) => (props.$selected ? "#f5f3ff" : "white")};

  &:hover {
    border-color: #7c3aed;
    background: #faf5ff;
  }
`;

const ChaveamentoHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
`;

const ChaveamentoIcon = styled.span`
  font-size: 1.25rem;
`;

const ChaveamentoTitle = styled.h4<{ $selected: boolean }>`
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${(props) => (props.$selected ? "#7c3aed" : "#374151")};
  margin: 0;
`;

const ChaveamentoDescription = styled.p`
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
  padding-left: 2rem;
`;

const ChaveamentoExample = styled.div`
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  padding-left: 2rem;
  background: #f3f4f6;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  color: #4b5563;
  font-family: monospace;
`;

// ============== COMPONENTE ==============

// Interface estendida para incluir tipoChaveamento
interface CriarEtapaFormData extends CriarEtapaDTO {
  tipoChaveamento?: TipoChaveamentoReiDaPraia;
}

export const CriarEtapa: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errosDatas, setErrosDatas] = useState<{
    dataInicio?: string;
    dataFim?: string;
    dataRealizacao?: string;
  }>({});

  const [formData, setFormData] = useState<CriarEtapaFormData>({
    nome: "",
    descricao: "",
    nivel: NivelJogador.INTERMEDIARIO,
    genero: GeneroJogador.MASCULINO,
    formato: FormatoEtapa.DUPLA_FIXA,
    tipoChaveamento: TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES, // ✅ NOVO
    dataInicio: "",
    dataFim: "",
    dataRealizacao: "",
    local: "",
    maxJogadores: 16,
    jogadoresPorGrupo: 3,
  });

  // ============== CÁLCULOS DE DISTRIBUIÇÃO ==============

  const calcularDistribuicaoDuplaFixa = () => {
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
  };

  const calcularDistribuicaoReiDaPraia = () => {
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
  };

  const infoDuplaFixa = calcularDistribuicaoDuplaFixa();
  const infoReiDaPraia = calcularDistribuicaoReiDaPraia();

  const infoAtual =
    formData.formato === FormatoEtapa.REI_DA_PRAIA
      ? infoReiDaPraia
      : infoDuplaFixa;

  // ============== VALIDAÇÕES ==============

  const validarDatas = () => {
    const erros: typeof errosDatas = {};

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
  };

  useEffect(() => {
    if (formData.dataInicio || formData.dataFim || formData.dataRealizacao) {
      validarDatas();
    }
  }, [formData.dataInicio, formData.dataFim, formData.dataRealizacao]);

  useEffect(() => {
    if (formData.formato === FormatoEtapa.REI_DA_PRAIA) {
      if (formData.maxJogadores < 8) {
        handleChange("maxJogadores", 8);
      } else if (formData.maxJogadores % 4 !== 0) {
        const ajustado = Math.ceil(formData.maxJogadores / 4) * 4;
        handleChange("maxJogadores", ajustado);
      }
    } else {
      if (formData.maxJogadores < 4) {
        handleChange("maxJogadores", 6);
      } else if (formData.maxJogadores % 2 !== 0) {
        handleChange("maxJogadores", formData.maxJogadores + 1);
      }
    }
  }, [formData.formato]);

  // ============== SUBMIT ==============

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      if (!validarDatas()) {
        setError("Corrija os erros nas datas antes de continuar");
        setLoading(false);
        return;
      }

      if (formData.formato === FormatoEtapa.REI_DA_PRAIA) {
        if (formData.maxJogadores < 8) {
          setError("Rei da Praia necessita de no mínimo 8 jogadores");
          setLoading(false);
          return;
        }
        if (formData.maxJogadores % 4 !== 0) {
          setError("Rei da Praia: número de jogadores deve ser múltiplo de 4");
          setLoading(false);
          return;
        }
      } else {
        if (formData.maxJogadores < 4) {
          setError("Mínimo de 4 jogadores necessário");
          setLoading(false);
          return;
        }
        if (formData.maxJogadores % 2 !== 0) {
          setError("Número de jogadores deve ser par");
          setLoading(false);
          return;
        }
      }

      if (formData.nome.length < 3) {
        setError("Nome deve ter no mínimo 3 caracteres");
        setLoading(false);
        return;
      }

      let jogadoresPorGrupoCalculado = 3;

      if (formData.formato === FormatoEtapa.REI_DA_PRAIA) {
        jogadoresPorGrupoCalculado = 4;
      } else {
        const totalDuplas = Math.floor(formData.maxJogadores / 2);
        jogadoresPorGrupoCalculado = Math.ceil(
          totalDuplas / infoDuplaFixa.qtdGrupos
        );
      }

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

      // ✅ Incluir tipoChaveamento apenas se for Rei da Praia
      if (formData.formato === FormatoEtapa.REI_DA_PRAIA) {
        dadosFormatados.tipoChaveamento = formData.tipoChaveamento;
      } else {
        delete dadosFormatados.tipoChaveamento;
      }

      console.log("📤 Dados enviados:", dadosFormatados);
      console.log("📤 Formato:", dadosFormatados.formato);

      await etapaService.criar(dadosFormatados);
      navigate("/admin/etapas");
    } catch (err: any) {
      console.error("Erro ao criar etapa:", err);
      setError(err.message || "Erro ao criar etapa");
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CriarEtapaFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ============== RENDER ==============

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate(-1)}>← Voltar</BackButton>
        <Title>Criar Nova Etapa</Title>
        <Subtitle>
          Preencha os dados para criar uma nova etapa do torneio
        </Subtitle>
      </Header>

      {error && (
        <ErrorAlert>
          <p>Erro ao criar etapa</p>
          <p>{error}</p>
        </ErrorAlert>
      )}

      <Form onSubmit={handleSubmit}>
        {/* Card de Formato */}
        <Card>
          <CardTitle>Formato do Torneio</CardTitle>

          <FormatoSelector>
            <FormatoOption
              $selected={formData.formato === FormatoEtapa.DUPLA_FIXA}
              $color="#3b82f6"
              onClick={() => handleChange("formato", FormatoEtapa.DUPLA_FIXA)}
            >
              <FormatoHeader>
                <FormatoIcon>👥</FormatoIcon>
                <FormatoTitle
                  $selected={formData.formato === FormatoEtapa.DUPLA_FIXA}
                >
                  Dupla Fixa
                </FormatoTitle>
              </FormatoHeader>
              <FormatoDescription>
                Jogadores formam duplas antes do torneio. As duplas jogam juntas
                em todas as partidas.
              </FormatoDescription>
              <FormatoBadge $color="#3b82f6">Tradicional</FormatoBadge>
            </FormatoOption>

            <FormatoOption
              $selected={formData.formato === FormatoEtapa.REI_DA_PRAIA}
              $color="#7c3aed"
              onClick={() => handleChange("formato", FormatoEtapa.REI_DA_PRAIA)}
            >
              <FormatoHeader>
                <FormatoIcon>👑</FormatoIcon>
                <FormatoTitle
                  $selected={formData.formato === FormatoEtapa.REI_DA_PRAIA}
                >
                  Rei da Praia
                </FormatoTitle>
              </FormatoHeader>
              <FormatoDescription>
                4 jogadores por grupo. Duplas são formadas a cada partida em
                combinações diferentes.
              </FormatoDescription>
              <FormatoBadge $color="#7c3aed">Individual</FormatoBadge>
            </FormatoOption>
          </FormatoSelector>
        </Card>

        {/* ✅ NOVO: Card de Tipo de Chaveamento (apenas Rei da Praia) */}
        {formData.formato === FormatoEtapa.REI_DA_PRAIA && (
          <Card $variant="purple">
            <CardTitle $variant="purple">
              👑 Chaveamento da Fase Eliminatória
            </CardTitle>
            <HelperText style={{ marginBottom: "1rem" }}>
              Escolha como as duplas serão formadas na fase eliminatória, após a
              fase de grupos
            </HelperText>

            <ChaveamentoSelector>
              {/* Opção 1: Melhores com Melhores */}
              <ChaveamentoOption
                $selected={
                  formData.tipoChaveamento ===
                  TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES
                }
                onClick={() =>
                  handleChange(
                    "tipoChaveamento",
                    TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES
                  )
                }
              >
                <ChaveamentoHeader>
                  <ChaveamentoIcon>🏆</ChaveamentoIcon>
                  <ChaveamentoTitle
                    $selected={
                      formData.tipoChaveamento ===
                      TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES
                    }
                  >
                    Melhores com Melhores
                  </ChaveamentoTitle>
                </ChaveamentoHeader>
                <ChaveamentoDescription>
                  Os melhores classificados formam dupla entre si, e os piores
                  entre si. Cria duplas de níveis extremos (muito fortes ou
                  fracas).
                </ChaveamentoDescription>
                <ChaveamentoExample>
                  Ex: 1º melhor + 2º melhor vs 3º melhor + 4º melhor
                </ChaveamentoExample>
              </ChaveamentoOption>

              {/* Opção 2: Pareamento por Ranking */}
              <ChaveamentoOption
                $selected={
                  formData.tipoChaveamento ===
                  TipoChaveamentoReiDaPraia.PAREAMENTO_POR_RANKING
                }
                onClick={() =>
                  handleChange(
                    "tipoChaveamento",
                    TipoChaveamentoReiDaPraia.PAREAMENTO_POR_RANKING
                  )
                }
              >
                <ChaveamentoHeader>
                  <ChaveamentoIcon>📊</ChaveamentoIcon>
                  <ChaveamentoTitle
                    $selected={
                      formData.tipoChaveamento ===
                      TipoChaveamentoReiDaPraia.PAREAMENTO_POR_RANKING
                    }
                  >
                    Pareamento por Ranking
                  </ChaveamentoTitle>
                </ChaveamentoHeader>
                <ChaveamentoDescription>
                  Cada 1º lugar forma dupla com o 2º lugar correspondente no
                  ranking. Cria duplas mais equilibradas, valorizando o
                  desempenho.
                </ChaveamentoDescription>
                <ChaveamentoExample>
                  Ex: 1º melhor 1º lugar + 1º melhor 2º lugar = Seed 1
                </ChaveamentoExample>
              </ChaveamentoOption>

              {/* Opção 3: Sorteio Aleatório */}
              <ChaveamentoOption
                $selected={
                  formData.tipoChaveamento ===
                  TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO
                }
                onClick={() =>
                  handleChange(
                    "tipoChaveamento",
                    TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO
                  )
                }
              >
                <ChaveamentoHeader>
                  <ChaveamentoIcon>🎲</ChaveamentoIcon>
                  <ChaveamentoTitle
                    $selected={
                      formData.tipoChaveamento ===
                      TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO
                    }
                  >
                    Sorteio Aleatório
                  </ChaveamentoTitle>
                </ChaveamentoHeader>
                <ChaveamentoDescription>
                  As duplas são formadas aleatoriamente entre os classificados.
                  Protege contra jogadores do mesmo grupo formarem dupla.
                </ChaveamentoDescription>
                <ChaveamentoExample>
                  Ex: Sorteio protegido - jogadores do mesmo grupo não podem
                  formar dupla
                </ChaveamentoExample>
              </ChaveamentoOption>
            </ChaveamentoSelector>
          </Card>
        )}

        <Card>
          <CardTitle>Informações Básicas</CardTitle>

          <FieldsContainer>
            <Field>
              <Label>Nome da Etapa *</Label>
              <Input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                placeholder="Ex: Etapa 1 - Classificatória"
              />
            </Field>

            <Field>
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => handleChange("descricao", e.target.value)}
                placeholder="Descreva os detalhes da etapa..."
                rows={3}
              />
            </Field>

            <Field>
              <Label>Gênero da Etapa *</Label>
              <Select
                required
                value={formData.genero}
                onChange={(e) =>
                  handleChange("genero", e.target.value as GeneroJogador)
                }
              >
                <option value={GeneroJogador.MASCULINO}>Masculino</option>
                <option value={GeneroJogador.FEMININO}>Feminino</option>
              </Select>
              <HelperText>
                Apenas jogadores deste gênero poderão se inscrever
              </HelperText>
            </Field>

            <Field>
              <Label>Nível da Etapa *</Label>
              <Select
                required
                value={formData.nivel}
                onChange={(e) =>
                  handleChange("nivel", e.target.value as NivelJogador)
                }
              >
                <option value={NivelJogador.INICIANTE}>Iniciante</option>
                <option value={NivelJogador.INTERMEDIARIO}>
                  Intermediário
                </option>
                <option value={NivelJogador.AVANCADO}>Avançado</option>
              </Select>
              <HelperText>
                Apenas jogadores deste nível poderão se inscrever
              </HelperText>
            </Field>

            <Field>
              <Label>Local</Label>
              <Input
                type="text"
                value={formData.local}
                onChange={(e) => handleChange("local", e.target.value)}
                placeholder="Ex: Quadras Arena Beach Tennis"
              />
            </Field>
          </FieldsContainer>
        </Card>

        <Card>
          <CardTitle>Datas</CardTitle>

          <GridContainer>
            <Field>
              <Label>Início das Inscrições *</Label>
              <Input
                type="date"
                required
                $hasError={!!errosDatas.dataInicio}
                value={formData.dataInicio}
                onChange={(e) => handleChange("dataInicio", e.target.value)}
              />
              {errosDatas.dataInicio && (
                <HelperText $error>⚠️ {errosDatas.dataInicio}</HelperText>
              )}
            </Field>

            <Field>
              <Label>Fim das Inscrições *</Label>
              <Input
                type="date"
                required
                $hasError={!!errosDatas.dataFim}
                value={formData.dataFim}
                onChange={(e) => handleChange("dataFim", e.target.value)}
              />
              {errosDatas.dataFim && (
                <HelperText $error>⚠️ {errosDatas.dataFim}</HelperText>
              )}
            </Field>

            <Field>
              <Label>Data de Realização *</Label>
              <Input
                type="date"
                required
                $hasError={!!errosDatas.dataRealizacao}
                value={formData.dataRealizacao}
                onChange={(e) => handleChange("dataRealizacao", e.target.value)}
              />
              {errosDatas.dataRealizacao && (
                <HelperText $error>⚠️ {errosDatas.dataRealizacao}</HelperText>
              )}
            </Field>
          </GridContainer>
        </Card>

        <Card>
          <CardTitle>Configurações</CardTitle>

          <FieldsContainer>
            <Field>
              <Label>Máximo de Jogadores *</Label>
              <Input
                type="number"
                required
                min={formData.formato === FormatoEtapa.REI_DA_PRAIA ? "8" : "4"}
                max="64"
                step={
                  formData.formato === FormatoEtapa.REI_DA_PRAIA ? "4" : "2"
                }
                value={formData.maxJogadores || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  handleChange(
                    "maxJogadores",
                    value === "" ? 0 : parseInt(value)
                  );
                }}
                onBlur={(e) => {
                  const valor = parseInt(e.target.value);

                  if (formData.formato === FormatoEtapa.REI_DA_PRAIA) {
                    if (isNaN(valor) || valor < 8) {
                      handleChange("maxJogadores", 8);
                    } else if (valor % 4 !== 0) {
                      handleChange("maxJogadores", Math.ceil(valor / 4) * 4);
                    }
                  } else {
                    if (isNaN(valor) || valor < 4) {
                      handleChange("maxJogadores", 6);
                    } else if (valor % 2 !== 0) {
                      handleChange("maxJogadores", valor + 1);
                    }
                  }
                }}
              />
              <HelperText>
                {formData.formato === FormatoEtapa.REI_DA_PRAIA
                  ? "Deve ser múltiplo de 4 (mínimo 8, máximo 64)"
                  : "Deve ser um número par (mínimo 4, máximo 64)"}
              </HelperText>
            </Field>

            {/* Preview baseado no formato */}
            {formData.formato === FormatoEtapa.REI_DA_PRAIA ? (
              <PreviewCard $variant="purple">
                <PreviewTitle $variant="purple">
                  👑 Distribuição Rei da Praia
                </PreviewTitle>

                {infoReiDaPraia.valido ? (
                  <PreviewContent>
                    <PreviewRow $variant="purple">
                      <span>
                        <strong>{infoReiDaPraia.totalJogadores}</strong>{" "}
                        jogadores
                      </span>
                      <span>→</span>
                      <span>
                        <strong>{infoReiDaPraia.qtdGrupos}</strong>{" "}
                        {infoReiDaPraia.qtdGrupos === 1 ? "grupo" : "grupos"}
                      </span>
                    </PreviewRow>

                    <PreviewBox>{infoReiDaPraia.descricao}</PreviewBox>

                    <PreviewNote $variant="purple">
                      ✓ Cada grupo tem 4 jogadores e 3 partidas (todas as
                      combinações)
                    </PreviewNote>
                    <PreviewNote $variant="purple">
                      ✓ Estatísticas individuais calculadas por jogador
                    </PreviewNote>
                    <PreviewNote $variant="purple">
                      ✓ Chaveamento eliminatório:{" "}
                      {formData.tipoChaveamento ===
                      TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES
                        ? "Melhores com Melhores"
                        : formData.tipoChaveamento ===
                          TipoChaveamentoReiDaPraia.PAREAMENTO_POR_RANKING
                        ? "Pareamento por Ranking"
                        : "Sorteio Aleatório"}
                    </PreviewNote>
                  </PreviewContent>
                ) : (
                  <PreviewRow $variant="purple">
                    {infoReiDaPraia.descricao}
                  </PreviewRow>
                )}
              </PreviewCard>
            ) : (
              <PreviewCard $variant="blue">
                <PreviewTitle $variant="blue">
                  👥 Distribuição Automática de Grupos
                </PreviewTitle>

                {infoDuplaFixa.valido ? (
                  <PreviewContent>
                    <PreviewRow $variant="blue">
                      <span>
                        <strong>{infoDuplaFixa.totalDuplas}</strong> duplas
                      </span>
                      <span>→</span>
                      <span>
                        <strong>{infoDuplaFixa.qtdGrupos}</strong>{" "}
                        {infoDuplaFixa.qtdGrupos === 1 ? "grupo" : "grupos"}
                      </span>
                    </PreviewRow>

                    <PreviewBox>{infoDuplaFixa.descricao}</PreviewBox>

                    <PreviewNote $variant="blue">
                      ✓ Grupos criados automaticamente com 3 duplas cada
                      (mínimo)
                    </PreviewNote>
                  </PreviewContent>
                ) : (
                  <PreviewRow $variant="blue">
                    {infoDuplaFixa.descricao}
                  </PreviewRow>
                )}
              </PreviewCard>
            )}
          </FieldsContainer>
        </Card>

        <ButtonsRow>
          <Button
            type="button"
            $variant="secondary"
            onClick={() => navigate(-1)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            $variant="primary"
            disabled={
              loading || !infoAtual.valido || Object.keys(errosDatas).length > 0
            }
          >
            {loading ? "Criando..." : "Criar Etapa"}
          </Button>
        </ButtonsRow>
      </Form>
      <Footer />
    </Container>
  );
};
