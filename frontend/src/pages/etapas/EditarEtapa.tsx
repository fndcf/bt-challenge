import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import {
  Etapa,
  AtualizarEtapaDTO,
  FormatoEtapa,
  StatusEtapa,
} from "../../types/etapa";
import { TipoChaveamentoReiDaPraia } from "../../types/reiDaPraia";
import { GeneroJogador, NivelJogador } from "../../types/jogador";
import etapaService from "../../services/etapaService";
import { format } from "date-fns";
import Footer from "@/components/Footer";

// ============== ANIMATIONS ==============

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

// ============== STYLED COMPONENTS ==============

const Container = styled.div`
  max-width: 56rem;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
`;

const LoadingContent = styled.div`
  text-align: center;
`;

const Spinner = styled.div`
  width: 3rem;
  height: 3rem;
  border: 2px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
  margin: 0 auto 1rem;
`;

const LoadingText = styled.p`
  color: #6b7280;
  margin: 0;
`;

const ErrorContainer = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1.5rem;
  text-align: center;
`;

const ErrorText = styled.p`
  color: #991b1b;
  font-weight: 500;
  margin: 0 0 1rem 0;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  transition: color 0.2s;

  &:hover {
    color: #111827;
  }
`;

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
`;

const Subtitle = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 0.9375rem;
`;

const Alert = styled.div<{ $variant: "red" | "yellow" | "purple" }>`
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;

  ${(props) => {
    switch (props.$variant) {
      case "red":
        return `
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        `;
      case "yellow":
        return `
          background: #fefce8;
          border: 1px solid #fef08a;
          color: #854d0e;
        `;
      case "purple":
        return `
          background: #faf5ff;
          border: 1px solid #e9d5ff;
          color: #6b21a8;
        `;
    }
  }}

  p {
    margin: 0;
    font-weight: 500;
  }

  ul {
    margin: 0.5rem 0 0 1rem;
    padding-left: 1rem;
    font-size: 0.875rem;
    font-weight: 400;
  }

  li {
    margin-top: 0.25rem;
  }
`;

const Form = styled.form`
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
`;

const FormError = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;

  p {
    color: #991b1b;
    margin: 0;
  }
`;

const FieldsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  margin-bottom: 0.5rem;
`;

const Required = styled.span`
  color: #dc2626;
`;

const Input = styled.input`
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    ring: 2px;
    ring-color: #3b82f6;
  }

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
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

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
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

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }
`;

const HelperText = styled.p<{ $variant?: "warning" | "info" | "purple" }>`
  font-size: 0.75rem;
  margin: 0.25rem 0 0 0;
  color: ${(props) => {
    switch (props.$variant) {
      case "warning":
        return "#b45309";
      case "purple":
        return "#7c3aed";
      default:
        return "#6b7280";
    }
  }};
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

//  Grid de 2 colunas
const GridContainer2 = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

//  Card de informação (somente leitura)
const InfoCard = styled.div<{ $variant?: "purple" | "blue" }>`
  background: ${(props) =>
    props.$variant === "purple"
      ? "linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)"
      : "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)"};
  border: 1px solid
    ${(props) => (props.$variant === "purple" ? "#e9d5ff" : "#bfdbfe")};
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const InfoIcon = styled.span`
  font-size: 1.5rem;
`;

const InfoContent = styled.div`
  flex: 1;
`;

const InfoLabel = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0 0 0.125rem 0;
`;

const InfoValue = styled.p<{ $color?: string }>`
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${(props) => props.$color || "#111827"};
  margin: 0;
`;

const ButtonsRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" }>`
  flex: 1;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  ${(props) =>
    props.$variant === "primary"
      ? `
    background: #3b82f6;
    color: white;

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

    &:hover:not(:disabled) {
      background: #f9fafb;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `}
`;

// ============== COMPONENTE ==============

export const EditarEtapa: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [etapa, setEtapa] = useState<Etapa | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const faseEliminatoriaGerada =
    etapa?.status === StatusEtapa.FASE_ELIMINATORIA ||
    etapa?.status === StatusEtapa.FINALIZADA;

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
  });

  // ✅ Detectar formato
  const isReiDaPraia = etapa?.formato === FormatoEtapa.REI_DA_PRAIA;

  useEffect(() => {
    carregarEtapa();
  }, [id]);

  const carregarEtapa = async () => {
    try {
      setLoading(true);
      if (!id) {
        setError("ID da etapa não informado");
        return;
      }

      const data = await etapaService.buscarPorId(id);
      setEtapa(data);

      const toInputDate = (timestamp: any) => {
        if (!timestamp) return "";
        const date = timestamp._seconds
          ? new Date(timestamp._seconds * 1000)
          : new Date(timestamp);
        return format(date, "yyyy-MM-dd");
      };

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
      });
    } catch (err: any) {
      setError(err.message || "Erro ao carregar etapa");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof AtualizarEtapaDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !etapa) return;

    try {
      setSalvando(true);
      setError(null);

      if (!formData.maxJogadores) {
        setError("Número máximo de jogadores é obrigatório");
        return;
      }

      // ✅ Validações específicas por formato
      if (isReiDaPraia) {
        if (formData.maxJogadores < 8) {
          setError("Rei da Praia requer mínimo de 8 jogadores");
          return;
        }

        if (formData.maxJogadores % 4 !== 0) {
          setError("Rei da Praia requer número de jogadores múltiplo de 4");
          return;
        }
      } else {
        if (formData.maxJogadores < 6) {
          setError("Número mínimo de jogadores é 6 (3 duplas)");
          return;
        }

        if (formData.maxJogadores % 2 !== 0) {
          setError("Número de jogadores deve ser par");
          return;
        }
      }

      if (formData.maxJogadores < etapa.totalInscritos) {
        setError(
          `Não é possível reduzir para ${formData.maxJogadores}. Já existem ${etapa.totalInscritos} jogador(es) inscrito(s).`
        );
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

      await etapaService.atualizar(id, dadosParaEnviar);
      alert("Etapa atualizada com sucesso!");
      navigate(`/admin/etapas/${id}`);
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar etapa");
    } finally {
      setSalvando(false);
    }
  };

  // ✅ Calcular mínimo de jogadores baseado no formato
  const calcularMinimoJogadores = () => {
    if (!etapa) return 6;

    const minimoFormato = isReiDaPraia ? 8 : 6;
    const minimoInscritos = etapa.totalInscritos;
    const minimo = Math.max(minimoFormato, minimoInscritos);

    if (isReiDaPraia) {
      // Arredondar para cima para múltiplo de 4
      return Math.ceil(minimo / 4) * 4;
    } else {
      // Arredondar para cima para número par
      return minimo % 2 === 0 ? minimo : minimo + 1;
    }
  };

  // ✅ Ajustar valor ao perder foco
  const ajustarValorJogadores = (valor: number) => {
    const minimo = calcularMinimoJogadores();

    if (valor < minimo) {
      return minimo;
    }

    if (isReiDaPraia) {
      // Arredondar para múltiplo de 4
      return Math.ceil(valor / 4) * 4;
    } else {
      // Arredondar para par
      return valor % 2 === 0 ? valor : valor + 1;
    }
  };

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingContent>
          <Spinner />
          <LoadingText>Carregando etapa...</LoadingText>
        </LoadingContent>
      </LoadingContainer>
    );
  }

  if (error && !etapa) {
    return (
      <Container>
        <ErrorContainer>
          <ErrorText>{error}</ErrorText>
          <Button $variant="primary" onClick={() => navigate("/admin/etapas")}>
            Voltar para etapas
          </Button>
        </ErrorContainer>
      </Container>
    );
  }

  if (!etapa) return null;

  const temInscritos = etapa.totalInscritos > 0;
  const chavesGeradas = etapa.chavesGeradas;

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate(`/admin/etapas/${id}`)}>
          ← Voltar
        </BackButton>

        <Title>{isReiDaPraia ? "👑" : "👥"} Editar Etapa</Title>
        <Subtitle>Atualize as informações da etapa</Subtitle>
      </Header>

      {chavesGeradas && (
        <Alert $variant="red">
          <p>Esta etapa não pode ser editada pois as chaves já foram geradas</p>
        </Alert>
      )}

      {temInscritos && !chavesGeradas && (
        <Alert $variant="yellow">
          <p>
            Esta etapa já possui inscritos. Algumas alterações são restritas:
          </p>
          <ul>
            <li>Não é possível alterar o nível ou gênero</li>
            <li>Não é possível diminuir o número máximo de jogadores</li>
          </ul>
        </Alert>
      )}

      {/*  Alerta específico para Rei da Praia */}
      {isReiDaPraia && (
        <Alert $variant="purple">
          <p>
            👑 Esta é uma etapa <strong>Rei da Praia</strong>. O formato e tipo
            de chaveamento não podem ser alterados após a criação.
          </p>
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        {error && (
          <FormError>
            <p>{error}</p>
          </FormError>
        )}

        <FieldsContainer>
          {/*  Cards de Formato e Chaveamento (somente leitura) */}
          <GridContainer2>
            <InfoCard $variant={isReiDaPraia ? "purple" : "blue"}>
              <InfoIcon>{isReiDaPraia ? "👑" : "👥"}</InfoIcon>
              <InfoContent>
                <InfoLabel>Formato</InfoLabel>
                <InfoValue $color={isReiDaPraia ? "#7c3aed" : "#2563eb"}>
                  {isReiDaPraia ? "Rei da Praia" : "Dupla Fixa"}
                </InfoValue>
              </InfoContent>
            </InfoCard>

            {/* Tipo de Chaveamento - Editável até gerar eliminatória */}
            {isReiDaPraia && (
              <Field>
                <Label>
                  Tipo de Chaveamento <Required>*</Required>
                </Label>
                <Select
                  required
                  disabled={faseEliminatoriaGerada}
                  value={formData.tipoChaveamento || ""}
                  onChange={(e) =>
                    handleChange(
                      "tipoChaveamento",
                      e.target.value as TipoChaveamentoReiDaPraia
                    )
                  }
                >
                  <option
                    value={TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES}
                  >
                    🏆 Melhores com Melhores
                  </option>
                  <option
                    value={TipoChaveamentoReiDaPraia.PAREAMENTO_POR_RANKING}
                  >
                    📊 Pareamento por Ranking
                  </option>
                  <option value={TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO}>
                    🎲 Sorteio Aleatório
                  </option>
                </Select>
                {faseEliminatoriaGerada ? (
                  <HelperText $variant="warning">
                    Não é possível alterar após gerar a fase eliminatória
                  </HelperText>
                ) : (
                  <HelperText $variant="purple">
                    Define como as duplas serão formadas na fase eliminatória
                  </HelperText>
                )}
              </Field>
            )}
          </GridContainer2>

          <Field>
            <Label>
              Nome da Etapa <Required>*</Required>
            </Label>
            <Input
              type="text"
              required
              disabled={chavesGeradas}
              value={formData.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              placeholder="Ex: Etapa 1 - Novembro 2025"
            />
          </Field>

          <Field>
            <Label>Descrição</Label>
            <Textarea
              disabled={chavesGeradas}
              value={formData.descricao}
              onChange={(e) => handleChange("descricao", e.target.value)}
              rows={3}
              placeholder="Informações adicionais sobre a etapa"
            />
          </Field>

          <GridContainer2>
            <Field>
              <Label>
                Gênero da Etapa <Required>*</Required>
              </Label>
              <Select
                required
                disabled={chavesGeradas || temInscritos}
                value={formData.genero}
                onChange={(e) =>
                  handleChange("genero", e.target.value as GeneroJogador)
                }
              >
                <option value={GeneroJogador.MASCULINO}>Masculino</option>
                <option value={GeneroJogador.FEMININO}>Feminino</option>
              </Select>
              {temInscritos && (
                <HelperText $variant="warning">
                  Não é possível alterar o gênero pois já existem jogadores
                  inscritos
                </HelperText>
              )}
            </Field>

            <Field>
              <Label>
                Nível da Etapa <Required>*</Required>
              </Label>
              <Select
                required
                disabled={chavesGeradas || temInscritos}
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
              {temInscritos && (
                <HelperText $variant="warning">
                  Não é possível alterar o nível pois já existem jogadores
                  inscritos
                </HelperText>
              )}
            </Field>
          </GridContainer2>

          <GridContainer>
            <Field>
              <Label>
                Início das Inscrições <Required>*</Required>
              </Label>
              <Input
                type="date"
                required
                disabled={chavesGeradas}
                value={formData.dataInicio}
                onChange={(e) => handleChange("dataInicio", e.target.value)}
              />
            </Field>

            <Field>
              <Label>
                Fim das Inscrições <Required>*</Required>
              </Label>
              <Input
                type="date"
                required
                disabled={chavesGeradas}
                value={formData.dataFim}
                onChange={(e) => handleChange("dataFim", e.target.value)}
              />
            </Field>

            <Field>
              <Label>
                Data de Realização <Required>*</Required>
              </Label>
              <Input
                type="date"
                required
                disabled={chavesGeradas}
                value={formData.dataRealizacao}
                onChange={(e) => handleChange("dataRealizacao", e.target.value)}
              />
            </Field>
          </GridContainer>

          <Field>
            <Label>Local</Label>
            <Input
              type="text"
              disabled={chavesGeradas}
              value={formData.local}
              onChange={(e) => handleChange("local", e.target.value)}
              placeholder="Ex: Arena Beach Tennis São Paulo"
            />
          </Field>

          <Field>
            <Label>
              Número Máximo de Jogadores <Required>*</Required>
            </Label>
            <Input
              type="number"
              required
              min={calcularMinimoJogadores()}
              max={64}
              step={isReiDaPraia ? 4 : 2}
              disabled={chavesGeradas}
              value={formData.maxJogadores || ""}
              onChange={(e) => {
                const value =
                  e.target.value === "" ? undefined : parseInt(e.target.value);
                handleChange("maxJogadores", value);
              }}
              onBlur={(e) => {
                if (e.target.value !== "") {
                  const valor = parseInt(e.target.value);
                  handleChange("maxJogadores", ajustarValorJogadores(valor));
                }
              }}
              placeholder={
                isReiDaPraia ? "Ex: 8, 12, 16, 20..." : "Ex: 16, 20, 24..."
              }
            />
            {/* ✅ Helper text específico por formato */}
            {isReiDaPraia ? (
              <HelperText $variant="purple">
                {temInscritos
                  ? `Mínimo de ${calcularMinimoJogadores()} (${
                      etapa.totalInscritos
                    } inscritos) - múltiplo de 4`
                  : "Múltiplo de 4 (mínimo 8, máximo 64)"}
              </HelperText>
            ) : temInscritos ? (
              <HelperText $variant="warning">
                Mínimo de {calcularMinimoJogadores()} ({etapa.totalInscritos}{" "}
                inscritos) - número par
              </HelperText>
            ) : (
              <HelperText $variant="info">
                Número par (mínimo 6, máximo 64)
              </HelperText>
            )}
          </Field>
        </FieldsContainer>

        <ButtonsRow>
          <Button
            type="button"
            $variant="secondary"
            onClick={() => navigate(`/admin/etapas/${id}`)}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            $variant="primary"
            disabled={salvando || chavesGeradas}
          >
            {salvando ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </ButtonsRow>
      </Form>
      <Footer />
    </Container>
  );
};
