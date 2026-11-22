/**
 * Responsabilidade única: Renderizar aba de inscrições
 */

import React, { useState } from "react";
import { X } from "lucide-react";
import styled from "styled-components";
import { SeloGenero } from "@/components/jogadores/Genero";
import { Button, EmptyState, IconButton, Pagination } from "@/components/ui";
import { theme } from "@/styles/theme";
import { Etapa, Inscricao } from "@/types/etapa";
import { GeneroJogador } from "@/types/jogador";
import { getNivelLabel } from "@/utils/formatters";

const { texto, superficie, acao } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

interface InscricoesTabProps {
  etapa: Etapa;
  inscricoes: Inscricao[];
  onInscricao: () => void;
  onCancelar: (inscricaoId: string, jogadorNome: string) => void;
  onCancelarMultiplos: (inscricaoIds: string[]) => Promise<void>;
}

const ITENS_POR_PAGINA = 12;

const Conteudo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
`;

const Barra = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[3]};
  padding: ${theme.spacing[3]} ${theme.spacing[4]};
  border: 1px solid ${superficie.borda};
  border-radius: ${theme.borderRadius.lg};
  background: ${superficie.fundoAlternativo};

  > div {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: ${theme.spacing[3]};
    font-size: ${fontSize.sm};
    color: ${texto.secundario};
  }
`;

const Grade = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr));
  gap: ${theme.spacing[3]};
`;

const Cartao = styled.div<{ $selecionado: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
  padding: ${theme.spacing[2]} ${theme.spacing[2]} ${theme.spacing[2]}
    ${theme.spacing[4]};
  border: 1px solid
    ${({ $selecionado }) => ($selecionado ? acao.primaria : superficie.borda)};
  border-radius: ${theme.borderRadius.lg};
  background: ${({ $selecionado }) =>
    $selecionado ? acao.fundoClaro : superficie.fundo};
  color: ${texto.secundario};
`;

const Jogador = styled.label<{ $clicavel: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
  min-width: 0;
  min-height: 44px;
  cursor: ${({ $clicavel }) => ($clicavel ? "pointer" : "default")};

  input {
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
    margin: 0;
    accent-color: ${acao.primaria};
    cursor: inherit;
  }
`;

const Dados = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: ${fontSize.sm};

  strong {
    font-size: ${fontSize.base};
    font-weight: ${fontWeight.semibold};
    color: ${texto.principal};
  }
`;

export const InscricoesTab: React.FC<InscricoesTabProps> = ({
  etapa,
  inscricoes,
  onInscricao,
  onCancelar,
  onCancelarMultiplos,
}) => {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [excluindo, setExcluindo] = useState(false);
  const [pagina, setPagina] = useState(1);

  const podeInscrever =
    etapa.status === "inscricoes_abertas" &&
    etapa.totalInscritos < etapa.maxJogadores;
  const podeEditar = etapa.status !== "finalizada" && !etapa.chavesGeradas;
  const isMisto = etapa.genero === GeneroJogador.MISTO;

  const inicio = (pagina - 1) * ITENS_POR_PAGINA;
  const daPagina = inscricoes.slice(inicio, inicio + ITENS_POR_PAGINA);
  const todosSelecionados = selecionados.size === inscricoes.length;

  const alternar = (inscricaoId: string) =>
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (!novo.delete(inscricaoId)) novo.add(inscricaoId);
      return novo;
    });

  const alternarTodos = () =>
    setSelecionados(
      todosSelecionados ? new Set() : new Set(inscricoes.map((i) => i.id))
    );

  const excluirSelecionados = async () => {
    const confirmou = window.confirm(
      `Deseja cancelar ${selecionados.size} inscrição(ões)?`
    );
    if (!confirmou) return;

    try {
      setExcluindo(true);
      await onCancelarMultiplos(Array.from(selecionados));
      setSelecionados(new Set());
    } catch (error: any) {
      alert(error.message || "Erro ao cancelar inscrições");
    } finally {
      setExcluindo(false);
    }
  };

  const botaoInscrever = podeInscrever && (
    <Button onClick={onInscricao}>Inscrever Jogador</Button>
  );

  if (inscricoes.length === 0) {
    return (
      <EmptyState titulo="Nenhum jogador inscrito ainda" acao={botaoInscrever} />
    );
  }

  return (
    <Conteudo>
      {botaoInscrever && <div>{botaoInscrever}</div>}

      {podeEditar && (
        <Barra>
          <div>
            <Button variant="outline" size="sm" onClick={alternarTodos}>
              {todosSelecionados ? "Desmarcar Todos" : "Selecionar Todos"}
            </Button>
            {selecionados.size > 0 && (
              <span>{selecionados.size} selecionado(s)</span>
            )}
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={excluirSelecionados}
            disabled={selecionados.size === 0 || excluindo}
          >
            {excluindo ? "Excluindo..." : "Excluir Selecionados"}
          </Button>
        </Barra>
      )}

      <Grade>
        {daPagina.map((inscricao) => {
          const nome = inscricao.jogadorNome || "Jogador";
          const selecionado = selecionados.has(inscricao.id);

          return (
            <Cartao key={inscricao.id} $selecionado={selecionado}>
              <Jogador $clicavel={podeEditar}>
                {podeEditar && (
                  <input
                    type="checkbox"
                    checked={selecionado}
                    onChange={() => alternar(inscricao.id)}
                  />
                )}
                <Dados>
                  <strong>{nome}</strong>
                  {inscricao.jogadorNivel && (
                    <span>{getNivelLabel(inscricao.jogadorNivel)}</span>
                  )}
                </Dados>
              </Jogador>
              {isMisto && <SeloGenero genero={inscricao.jogadorGenero} />}
              {podeEditar && (
                <IconButton
                  rotulo={`Cancelar inscrição de ${nome}`}
                  tom="perigo"
                  icone={<X aria-hidden="true" />}
                  onClick={() => onCancelar(inscricao.id, nome)}
                />
              )}
            </Cartao>
          );
        })}
      </Grade>

      {inscricoes.length > ITENS_POR_PAGINA && (
        <Pagination
          currentPage={pagina}
          totalPages={Math.ceil(inscricoes.length / ITENS_POR_PAGINA)}
          totalItems={inscricoes.length}
          itemsPerPage={ITENS_POR_PAGINA}
          onPageChange={setPagina}
        />
      )}
    </Conteudo>
  );
};

export default InscricoesTab;
