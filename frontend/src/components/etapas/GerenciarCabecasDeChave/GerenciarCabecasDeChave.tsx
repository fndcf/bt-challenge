import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { getCabecaDeChaveService } from "@/services";
import { CabecaDeChave } from "@/types/cabecaDeChave";
import { Inscricao } from "@/types/etapa";
import { FormatoEtapa } from "@/types/etapa";
import { Pagination, LoadingOverlay } from "@/components/ui";

// ===== STYLES =====

const Container = styled.div`
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-top: 1rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const HeaderContent = styled.div``;

const Title = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #92400e;
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: #92400e;
  margin: 0.25rem 0 0 0;
  opacity: 0.8;
`;

const InfoBox = styled.div`
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin-bottom: 1rem;

  p {
    margin: 0;
    font-size: 0.875rem;
    color: #92400e;
    line-height: 1.5;
  }
`;

const CabecasLista = styled.div`
  margin-bottom: 1rem;
`;

const ListaTitle = styled.p`
  font-size: 0.875rem;
  font-weight: 600;
  color: #92400e;
  margin: 0 0 0.5rem 0;
`;

const CabecaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  border: 1px solid #fbbf24;
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
`;

const CabecaOrdem = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: #fbbf24;
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
`;

const CabecaNome = styled.span`
  flex: 1;
  font-weight: 500;
  color: #92400e;
`;

const CabecaActions = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const ActionButton = styled.button`
  padding: 0.25rem 0.5rem;
  background: #fbbf24;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #f59e0b;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const RemoveButton = styled.button`
  padding: 0.25rem 0.5rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #b91c1c;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const Divider = styled.div`
  height: 1px;
  background: #fbbf24;
  margin: 1rem 0;
`;

const JogadoresLista = styled.div``;

const JogadorItem = styled.div<{ $ehCabeca: boolean; $estaSelecionado: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: ${(props) => {
    if (props.$ehCabeca) return "#fde68a"; // Amarelo forte/vibrante para quem JÁ é cabeça
    if (props.$estaSelecionado) return "#fef9e7"; // Amarelo bem claro para selecionado
    return "white";
  }};
  border: 2px solid ${(props) => {
    if (props.$ehCabeca) return "#f59e0b"; // Laranja para quem JÁ é cabeça (mais forte)
    if (props.$estaSelecionado) return "#fbbf24"; // Amarelo para selecionado
    return "#e5e7eb";
  }};
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${(props) => props.$ehCabeca ? "#f59e0b" : "#fbbf24"};
    transform: translateX(4px);
  }
`;

// Checkbox removido - seleção por clique no card inteiro

const JogadorInfo = styled.div`
  flex: 1;
`;

const JogadorNome = styled.p`
  font-weight: 500;
  color: #111827;
  margin: 0 0 0.25rem 0;
`;

const JogadorNivel = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.5rem;
  background: #fbbf24;
  color: white;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.875rem;
`;

// Empty state para quando readOnly e sem cabeças
const EmptyState = styled.div`
  text-align: center;
  padding: 2rem 1rem;
  color: #92400e;
  opacity: 0.7;

  p {
    margin: 0;
    font-size: 0.875rem;
  }
`;

const ActionsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border: 1px solid #fbbf24;
  border-radius: 0.375rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
`;

const SelectionInfo = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #92400e;
`;

const ActionsButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionBarButton = styled.button<{ $variant: "primary" | "danger" }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  ${props => props.$variant === "primary" ? `
    background: #fbbf24;
    color: white;
    &:hover:not(:disabled) { background: #f59e0b; }
  ` : `
    background: #dc2626;
    color: white;
    &:hover:not(:disabled) { background: #b91c1c; }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface Props {
  arenaId: string;
  etapaId: string;
  inscricoes: Inscricao[];
  formato: FormatoEtapa;
  totalInscritos: number;
  qtdGrupos?: number;
  onUpdate: () => void;
  readOnly?: boolean;
}

export const GerenciarCabecasDeChave: React.FC<Props> = ({
  arenaId,
  etapaId,
  inscricoes = [],
  formato,
  totalInscritos,
  qtdGrupos,
  onUpdate,
  readOnly = false,
}) => {
  const cabecaDeChaveService = getCabecaDeChaveService();
  const [cabecas, setCabecas] = useState<CabecaDeChave[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalLoadingMessage, setGlobalLoadingMessage] = useState("");

  const isReiDaPraia = formato === FormatoEtapa.REI_DA_PRAIA;

  // Paginação
  const { paginatedInscricoes, totalPages } = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      paginatedInscricoes: inscricoes.slice(startIndex, endIndex),
      totalPages: Math.ceil(inscricoes.length / itemsPerPage),
    };
  }, [inscricoes, currentPage, itemsPerPage]);

  const calcularLimite = (): number => {
    if (isReiDaPraia) {
      return Math.floor(totalInscritos / 4);
    } else {
      return (qtdGrupos || 0) * 2;
    }
  };

  const limiteCabecas = calcularLimite();

  const carregarCabecas = async () => {
    if (!arenaId || !etapaId) return;

    try {
      setLoading(true);
      const data = await cabecaDeChaveService.listarAtivas(arenaId, etapaId);
      setCabecas(data || []);
    } catch (error) {
      setCabecas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarCabecas();
  }, [arenaId, etapaId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Validações
  if (!inscricoes || !Array.isArray(inscricoes) || inscricoes.length === 0) {
    return null;
  }

  // handleToggleCabeca removida - agora usa handleAdicionarSelecionados e handleRemoverCabeca

  const handleMoverOrdem = async (
    cabeca: CabecaDeChave,
    direcao: "up" | "down"
  ) => {
    if (readOnly) return;
    const index = cabecas.findIndex((c) => c.id === cabeca.id);

    if (direcao === "up" && index === 0) return;
    if (direcao === "down" && index === cabecas.length - 1) return;

    const novaOrdem = [...cabecas];
    const targetIndex = direcao === "up" ? index - 1 : index + 1;

    [novaOrdem[index], novaOrdem[targetIndex]] = [
      novaOrdem[targetIndex],
      novaOrdem[index],
    ];

    const ordens = novaOrdem.map((c, i) => ({
      jogadorId: c.jogadorId,
      ordem: i + 1,
    }));

    try {
      setGlobalLoading(true);
      setGlobalLoadingMessage(`Reordenando cabeça de chave...`);
      await cabecaDeChaveService.reordenar(arenaId, etapaId, ordens);
      await carregarCabecas();
      onUpdate();
    } catch (error: any) {
      alert("Erro ao reordenar cabeças");
    } finally {
      setGlobalLoading(false);
      setGlobalLoadingMessage("");
    }
  };

  const handleRemoverCabeca = async (jogadorId: string, jogadorNome: string) => {
    if (readOnly) return;

    try {
      setGlobalLoading(true);
      setGlobalLoadingMessage(`Removendo ${jogadorNome} das cabeças de chave...`);
      await cabecaDeChaveService.remover(arenaId, etapaId, jogadorId);
      await carregarCabecas();
      onUpdate();
    } catch (error: any) {
      alert(error.message || "Erro ao remover cabeça");
    } finally {
      setGlobalLoading(false);
      setGlobalLoadingMessage("");
    }
  };

  const getCabecaOrdem = (jogadorId: string): number | null => {
    if (!jogadorId) return null;
    const cabeca = cabecas.find((c) => c.jogadorId === jogadorId);
    return cabeca ? cabeca.ordem : null;
  };

  const toggleSelecao = (jogadorId: string) => {
    setSelecionados(prev => {
      const novo = new Set(prev);
      if (novo.has(jogadorId)) {
        novo.delete(jogadorId);
      } else {
        // Não permitir selecionar jogadores que JÁ são cabeças
        const jaEhCabeca = cabecas.some(c => c.jogadorId === jogadorId);
        if (!jaEhCabeca) {
          novo.add(jogadorId);
        }
      }
      return novo;
    });
  };

  const handleAdicionarSelecionados = async () => {
    if (selecionados.size === 0) {
      alert("Selecione pelo menos um jogador");
      return;
    }

    // Validar limite
    if (cabecas.length + selecionados.size > limiteCabecas) {
      alert(
        `Limite atingido! Máximo de ${limiteCabecas} cabeça(s) de chave. ` +
        `Você já tem ${cabecas.length} e está tentando adicionar ${selecionados.size}.`
      );
      return;
    }

    try {
      setGlobalLoading(true);
      setGlobalLoadingMessage(`Adicionando ${selecionados.size} cabeça(s) de chave...`);

      const maiorOrdem =
        cabecas.length > 0 ? Math.max(...cabecas.map((c) => c.ordem)) : 0;

      const promises = Array.from(selecionados).map(async (jogadorId, index) => {
        const inscricao = inscricoes.find(i => i.jogadorId === jogadorId);
        if (!inscricao) return null;

        return cabecaDeChaveService.criar({
          arenaId,
          etapaId,
          jogadorId: inscricao.jogadorId,
          jogadorNome: inscricao.jogadorNome,
          ordem: maiorOrdem + index + 1,
        });
      });

      await Promise.all(promises);
      await carregarCabecas();
      setSelecionados(new Set());
      onUpdate();
    } catch (error: any) {
      alert(error.message || "Erro ao adicionar cabeças");
    } finally {
      setGlobalLoading(false);
      setGlobalLoadingMessage("");
    }
  };

  // Função de remover selecionados foi removida - remoção feita apenas pelos botões individuais X

  return (
    <Container>
      <Header>
        <HeaderContent>
          <Title>Cabeças de Chave</Title>
          <Subtitle>
            {cabecas.length} / {limiteCabecas} selecionado(s)
            {readOnly && " (Somente visualização)"}
          </Subtitle>
        </HeaderContent>
      </Header>

      <InfoBox>
        <p>
          {isReiDaPraia ? (
            <>
              <strong>Rei da Praia:</strong> Cabeças de chave ficam em grupos
              separados (1 por grupo). Máximo: {limiteCabecas} cabeça(s).
            </>
          ) : (
            <>
              <strong>Dupla Fixa:</strong> Cabeças de chave não podem formar
              dupla juntas. Máximo: {limiteCabecas} cabeça(s) (2 por grupo).
            </>
          )}
        </p>
      </InfoBox>

      {!readOnly && selecionados.size > 0 && (
        <ActionsBar>
          <SelectionInfo>
            {selecionados.size} jogador(es) selecionado(s)
          </SelectionInfo>
          <ActionsButtons>
            <ActionBarButton
              $variant="primary"
              onClick={handleAdicionarSelecionados}
              disabled={loading || globalLoading}
            >
              Adicionar Selecionados
            </ActionBarButton>
          </ActionsButtons>
        </ActionsBar>
      )}

      {cabecas.length > 0 && (
        <CabecasLista>
          <ListaTitle>
            {readOnly
              ? "Cabeças de Chave Definidas:"
              : "Ordem das Cabeças de Chave:"}
          </ListaTitle>
          {cabecas
            .sort((a, b) => a.ordem - b.ordem)
            .map((cabeca, index) => (
              <CabecaItem key={cabeca.id}>
                <CabecaOrdem>#{cabeca.ordem}</CabecaOrdem>
                <CabecaNome>{cabeca.jogadorNome}</CabecaNome>

                {/* OCULTAR botões completamente quando readOnly */}
                {!readOnly && (
                  <CabecaActions>
                    <ActionButton
                      onClick={() => handleMoverOrdem(cabeca, "up")}
                      disabled={index === 0 || globalLoading}
                      title="Mover para cima"
                    >
                      ▲
                    </ActionButton>
                    <ActionButton
                      onClick={() => handleMoverOrdem(cabeca, "down")}
                      disabled={index === cabecas.length - 1 || globalLoading}
                      title="Mover para baixo"
                    >
                      ▼
                    </ActionButton>
                    <RemoveButton
                      onClick={() => handleRemoverCabeca(cabeca.jogadorId, cabeca.jogadorNome)}
                      disabled={globalLoading}
                      title="Remover"
                    >
                      ✕
                    </RemoveButton>
                  </CabecaActions>
                )}
              </CabecaItem>
            ))}
        </CabecasLista>
      )}

      {/* OCULTAR completamente lista de jogadores quando readOnly */}
      {!readOnly && (
        <>
          <Divider />

          <JogadoresLista>
            <ListaTitle>Selecione Jogadores como Cabeças:</ListaTitle>
            {paginatedInscricoes.map((inscricao) => {
              const ordem = getCabecaOrdem(inscricao.jogadorId);
              const ehCabeca = ordem !== null;
              const estaSelecionado = selecionados.has(inscricao.jogadorId);

              return (
                <JogadorItem
                  key={inscricao.id}
                  $ehCabeca={ehCabeca}
                  $estaSelecionado={estaSelecionado}
                  onClick={() => toggleSelecao(inscricao.jogadorId)}
                >
                  <JogadorInfo>
                    <JogadorNome>{inscricao.jogadorNome}</JogadorNome>
                    <JogadorNivel>
                      {inscricao.jogadorNivel === "iniciante" && "Iniciante"}
                      {inscricao.jogadorNivel === "intermediario" &&
                        "Intermediário"}
                      {inscricao.jogadorNivel === "avancado" && "Avançado"}
                    </JogadorNivel>
                  </JogadorInfo>
                  {ehCabeca && <Badge>#{ordem}</Badge>}
                </JogadorItem>
              );
            })}
          </JogadoresLista>

          {/* Paginação */}
          {inscricoes.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={inscricoes.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {/*  Mensagem quando readOnly e sem cabeças */}
      {readOnly && cabecas.length === 0 && (
        <EmptyState>
          <p>Nenhuma cabeça de chave foi definida para esta etapa.</p>
        </EmptyState>
      )}

      <LoadingOverlay isLoading={globalLoading} message={globalLoadingMessage} />
    </Container>
  );
};
