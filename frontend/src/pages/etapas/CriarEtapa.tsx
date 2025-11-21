/**
 * CriarEtapa - Usando MESMA estrutura do Dashboard
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { CriarEtapaDTO } from "../../types/etapa";
import { GeneroJogador, NivelJogador } from "../../types/jogador";
import etapaService from "../../services/etapaService";

// ============== STYLED COMPONENTS ==============

// ⭐ MESMA estrutura do Dashboard - SEM padding-top
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

const Card = styled.div`
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;

  @media (max-width: 768px) {
    padding: 1.25rem;
  }
`;

const CardTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem 0;
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

const PreviewCard = styled.div`
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 1rem;
`;

const PreviewTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e40af;
  margin: 0 0 0.5rem 0;
`;

const PreviewContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const PreviewRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #1e40af;

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

const PreviewNote = styled.p`
  font-size: 0.75rem;
  color: #2563eb;
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

// ============== COMPONENTE ==============

export const CriarEtapa: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errosDatas, setErrosDatas] = useState<{
    dataInicio?: string;
    dataFim?: string;
    dataRealizacao?: string;
  }>({});

  const [formData, setFormData] = useState<CriarEtapaDTO>({
    nome: "",
    descricao: "",
    nivel: NivelJogador.INTERMEDIARIO,
    genero: GeneroJogador.MASCULINO,
    dataInicio: "",
    dataFim: "",
    dataRealizacao: "",
    local: "",
    maxJogadores: 16,
    jogadoresPorGrupo: 3,
  });

  const calcularDistribuicaoGrupos = () => {
    if (
      !formData.maxJogadores ||
      isNaN(formData.maxJogadores) ||
      formData.maxJogadores < 6
    ) {
      return {
        qtdGrupos: 0,
        distribuicao: [],
        descricao: "Informe o número de jogadores (mínimo 6)",
        totalDuplas: 0,
      };
    }

    const totalDuplas = Math.floor(formData.maxJogadores / 2);

    if (totalDuplas < 3) {
      return {
        qtdGrupos: 0,
        distribuicao: [],
        descricao: "Mínimo de 6 jogadores (3 duplas) necessário",
        totalDuplas: 0,
      };
    }

    if (totalDuplas === 5) {
      return {
        qtdGrupos: 1,
        distribuicao: [5],
        descricao: "Grupo 1: 5 duplas",
        totalDuplas: 5,
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
    };
  };

  const infoGrupos = calcularDistribuicaoGrupos();

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

      if (formData.maxJogadores < 6) {
        setError("Mínimo de 6 jogadores necessário");
        setLoading(false);
        return;
      }

      const totalDuplas = Math.floor(formData.maxJogadores / 2);

      const jogadoresPorGrupoCalculado = Math.ceil(
        totalDuplas / infoGrupos.qtdGrupos
      );

      const dadosFormatados: CriarEtapaDTO = {
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

      await etapaService.criar(dadosFormatados);
      navigate("/admin/etapas");
    } catch (err: any) {
      console.error("Erro ao criar etapa:", err);
      setError(err.message || "Erro ao criar etapa");
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CriarEtapaDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate("/admin/etapas")}>
          ← Voltar
        </BackButton>
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
                ⚠️ Apenas jogadores deste gênero poderão se inscrever
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
                <option value={NivelJogador.INICIANTE}>🌱 Iniciante</option>
                <option value={NivelJogador.INTERMEDIARIO}>
                  ⚡ Intermediário
                </option>
                <option value={NivelJogador.AVANCADO}>🔥 Avançado</option>
              </Select>
              <HelperText>
                ⚠️ Apenas jogadores deste nível poderão se inscrever
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
                min="6"
                max="64"
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
                  if (isNaN(valor) || valor < 6) {
                    handleChange("maxJogadores", 6);
                  } else if (valor % 2 !== 0) {
                    handleChange("maxJogadores", valor + 1);
                  }
                }}
              />
              <HelperText>
                Deve ser um número par (mínimo 6, máximo 64)
              </HelperText>
            </Field>

            <PreviewCard>
              <PreviewTitle>📊 Distribuição Automática de Grupos</PreviewTitle>

              {infoGrupos.qtdGrupos > 0 ? (
                <PreviewContent>
                  <PreviewRow>
                    <span>
                      <strong>{infoGrupos.totalDuplas}</strong> duplas
                    </span>
                    <span>→</span>
                    <span>
                      <strong>{infoGrupos.qtdGrupos}</strong>{" "}
                      {infoGrupos.qtdGrupos === 1 ? "grupo" : "grupos"}
                    </span>
                  </PreviewRow>

                  <PreviewBox>{infoGrupos.descricao}</PreviewBox>

                  <PreviewNote>
                    ✓ Grupos criados automaticamente com 3 duplas cada (mínimo)
                  </PreviewNote>
                </PreviewContent>
              ) : (
                <PreviewRow>{infoGrupos.descricao}</PreviewRow>
              )}
            </PreviewCard>
          </FieldsContainer>
        </Card>

        <ButtonsRow>
          <Button
            type="button"
            $variant="secondary"
            onClick={() => navigate("/admin/etapas")}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            $variant="primary"
            disabled={
              loading ||
              infoGrupos.qtdGrupos === 0 ||
              Object.keys(errosDatas).length > 0
            }
          >
            {loading ? "Criando..." : "Criar Etapa"}
          </Button>
        </ButtonsRow>
      </Form>
    </Container>
  );
};
