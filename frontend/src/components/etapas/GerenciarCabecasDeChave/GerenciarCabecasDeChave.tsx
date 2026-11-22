/**
 * Cabeças de chave da etapa (Dupla Fixa e Rei da Praia)
 */

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  IconButton,
  LoadingOverlay,
  Pagination,
} from "@/components/ui";
import { getCabecaDeChaveService } from "@/services";
import { theme } from "@/styles/theme";
import { CabecaDeChave } from "@/types/cabecaDeChave";
import { FormatoEtapa, Inscricao } from "@/types/etapa";
import { getMensagemErro } from "@/utils/erro";
import { getNivelLabel } from "@/utils/formatters";

const { texto, superficie, acao } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

const ITENS_POR_PAGINA = 12;

// ===== STYLES =====

const Container = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
  padding: ${theme.spacing[6]};
  border: 1px solid ${superficie.borda};
  border-radius: ${theme.borderRadius.lg};
  background: ${superficie.fundo};

  @media (max-width: ${theme.breakpoints.sm}) {
    padding: ${theme.spacing[4]};
  }
`;

const Titulo = styled.h3`
  margin: 0;
  font-size: ${fontSize.lg};
  font-weight: ${fontWeight.semibold};
  color: ${texto.principal};
`;

const Subtitulo = styled.p`
  margin: ${theme.spacing[1]} 0 0 0;
  font-size: ${fontSize.sm};
  color: ${texto.secundario};
`;

const ListaTitulo = styled.h4`
  margin: 0 0 ${theme.spacing[2]} 0;
  font-size: ${fontSize.sm};
  font-weight: ${fontWeight.semibold};
  color: ${texto.principal};
`;

const Lista = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[2]};
`;

const Linha = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
  min-height: 48px;
  padding: ${theme.spacing[1]} ${theme.spacing[2]} ${theme.spacing[1]}
    ${theme.spacing[3]};
  border: 1px solid ${superficie.borda};
  border-radius: ${theme.borderRadius.md};
  color: ${texto.secundario};
`;

const Nome = styled.span`
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
  font-weight: ${fontWeight.medium};
  color: ${texto.principal};
`;

const Grade = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr));
  gap: ${theme.spacing[2]};
`;

const Jogador = styled.label<{ $selecionado: boolean; $cabeca: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
  min-height: 56px;
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  border: 1px solid
    ${({ $selecionado }) => ($selecionado ? acao.primaria : superficie.borda)};
  border-radius: ${theme.borderRadius.md};
  background: ${({ $selecionado, $cabeca }) =>
    $selecionado
      ? acao.fundoClaro
      : $cabeca
      ? superficie.fundoAlternativo
      : superficie.fundo};
  cursor: ${({ $cabeca }) => ($cabeca ? "default" : "pointer")};

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
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const Nivel = styled.span`
  font-size: ${fontSize.sm};
  color: ${texto.secundario};
`;

const BarraSelecao = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[3]};
  padding: ${theme.spacing[3]} ${theme.spacing[4]};
  border: 1px solid ${superficie.borda};
  border-radius: ${theme.borderRadius.md};
  background: ${superficie.fundoAlternativo};
  font-size: ${fontSize.sm};
  font-weight: ${fontWeight.semibold};
  color: ${texto.principal};
`;

// ===== COMPONENTE =====

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
  const [pagina, setPagina] = useState(1);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  // Mensagem da operação em andamento; null = nada em andamento
  const [operacao, setOperacao] = useState<string | null>(null);

  const isReiDaPraia = formato === FormatoEtapa.REI_DA_PRAIA;
  const limite = isReiDaPraia
    ? Math.floor(totalInscritos / 4)
    : (qtdGrupos || 0) * 2;

  const carregarCabecas = async () => {
    if (!arenaId || !etapaId) return;

    try {
      setLoading(true);
      const data = await cabecaDeChaveService.listarAtivas(arenaId, etapaId);
      setCabecas([...(data || [])].sort((a, b) => a.ordem - b.ordem));
    } catch {
      setCabecas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarCabecas();
  }, [arenaId, etapaId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!Array.isArray(inscricoes) || inscricoes.length === 0) {
    return null;
  }

  const inicio = (pagina - 1) * ITENS_POR_PAGINA;
  const daPagina = inscricoes.slice(inicio, inicio + ITENS_POR_PAGINA);

  /** Executa a operação, recarrega as cabeças e avisa a página */
  const executar = async (
    mensagem: string,
    mensagemErro: (error: unknown) => string,
    operar: () => Promise<unknown>
  ) => {
    try {
      setOperacao(mensagem);
      await operar();
      await carregarCabecas();
      onUpdate();
    } catch (error) {
      alert(mensagemErro(error));
    } finally {
      setOperacao(null);
    }
  };

  const mover = (indice: number, direcao: -1 | 1) => {
    const novaOrdem = [...cabecas];
    const destino = indice + direcao;
    [novaOrdem[indice], novaOrdem[destino]] = [
      novaOrdem[destino],
      novaOrdem[indice],
    ];

    return executar(
      "Reordenando cabeça de chave...",
      () => "Erro ao reordenar cabeças",
      () =>
        cabecaDeChaveService.reordenar(
          arenaId,
          etapaId,
          novaOrdem.map(({ jogadorId }, i) => ({ jogadorId, ordem: i + 1 }))
        )
    );
  };

  const remover = ({ jogadorId, jogadorNome }: CabecaDeChave) =>
    executar(
      `Removendo ${jogadorNome} das cabeças de chave...`,
      (error) => getMensagemErro(error, "Erro ao remover cabeça"),
      () => cabecaDeChaveService.remover(arenaId, etapaId, jogadorId)
    );

  const alternarSelecao = (jogadorId: string) =>
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (!novo.delete(jogadorId)) novo.add(jogadorId);
      return novo;
    });

  const adicionarSelecionados = () => {
    if (cabecas.length + selecionados.size > limite) {
      alert(
        `Limite atingido! Máximo de ${limite} cabeça(s) de chave. ` +
          `Você já tem ${cabecas.length} e está tentando adicionar ${selecionados.size}.`
      );
      return;
    }

    const maiorOrdem = Math.max(0, ...cabecas.map((c) => c.ordem));

    return executar(
      `Adicionando ${selecionados.size} cabeça(s) de chave...`,
      (error) => getMensagemErro(error, "Erro ao adicionar cabeças"),
      async () => {
        await Promise.all(
          Array.from(selecionados).map((id, indice) => {
            const inscricao = inscricoes.find((i) => i.jogadorId === id);
            return (
              inscricao &&
              cabecaDeChaveService.criar({
                arenaId,
                etapaId,
                jogadorId: inscricao.jogadorId,
                jogadorNome: inscricao.jogadorNome,
                ordem: maiorOrdem + indice + 1,
              })
            );
          })
        );
        setSelecionados(new Set());
      }
    );
  };

  return (
    <Container>
      <div>
        <Titulo>Cabeças de Chave</Titulo>
        <Subtitulo>
          {cabecas.length} / {limite} selecionado(s)
          {readOnly && " (Somente visualização)"}
        </Subtitulo>
      </div>

      <Alert>
        {isReiDaPraia ? (
          <p>
            <strong>Rei da Praia:</strong> Cabeças de chave ficam em grupos
            separados (1 por grupo). Máximo: {limite} cabeça(s).
          </p>
        ) : (
          <p>
            <strong>Dupla Fixa:</strong> Cabeças de chave não podem formar dupla
            juntas. Máximo: {limite} cabeça(s) (2 por grupo).
          </p>
        )}
      </Alert>

      {cabecas.length > 0 && (
        <div>
          <ListaTitulo>
            {readOnly
              ? "Cabeças de Chave Definidas:"
              : "Ordem das Cabeças de Chave:"}
          </ListaTitulo>
          <Lista>
            {cabecas.map((cabeca, indice) => (
              <Linha key={cabeca.id}>
                <Badge formato={formato}>{`#${cabeca.ordem}`}</Badge>
                <Nome>{cabeca.jogadorNome}</Nome>
                {!readOnly && (
                  <>
                    <IconButton
                      rotulo={`Mover ${cabeca.jogadorNome} para cima`}
                      title="Mover para cima"
                      icone={<ArrowUp aria-hidden="true" />}
                      onClick={() => mover(indice, -1)}
                      disabled={indice === 0 || !!operacao}
                    />
                    <IconButton
                      rotulo={`Mover ${cabeca.jogadorNome} para baixo`}
                      title="Mover para baixo"
                      icone={<ArrowDown aria-hidden="true" />}
                      onClick={() => mover(indice, 1)}
                      disabled={indice === cabecas.length - 1 || !!operacao}
                    />
                    <IconButton
                      rotulo={`Remover ${cabeca.jogadorNome}`}
                      title="Remover"
                      tom="perigo"
                      icone={<X aria-hidden="true" />}
                      onClick={() => remover(cabeca)}
                      disabled={!!operacao}
                    />
                  </>
                )}
              </Linha>
            ))}
          </Lista>
        </div>
      )}

      {readOnly && cabecas.length === 0 && (
        <EmptyState titulo="Nenhuma cabeça de chave foi definida para esta etapa." />
      )}

      {!readOnly && selecionados.size > 0 && (
        <BarraSelecao>
          <span>{`${selecionados.size} jogador(es) selecionado(s)`}</span>
          <Button
            onClick={adicionarSelecionados}
            disabled={loading || !!operacao}
          >
            Adicionar Selecionados
          </Button>
        </BarraSelecao>
      )}

      {!readOnly && (
        <div>
          <ListaTitulo>Selecione Jogadores como Cabeças:</ListaTitulo>
          <Grade>
            {daPagina.map((inscricao) => {
              const cabeca = cabecas.find(
                (c) => c.jogadorId === inscricao.jogadorId
              );
              const selecionado = selecionados.has(inscricao.jogadorId);

              return (
                <Jogador
                  key={inscricao.id}
                  $selecionado={selecionado}
                  $cabeca={!!cabeca}
                >
                  {cabeca ? (
                    <Badge formato={formato}>{`#${cabeca.ordem}`}</Badge>
                  ) : (
                    <input
                      type="checkbox"
                      checked={selecionado}
                      onChange={() => alternarSelecao(inscricao.jogadorId)}
                    />
                  )}
                  <Dados>
                    <Nome>{inscricao.jogadorNome}</Nome>
                    {inscricao.jogadorNivel && (
                      <Nivel>{getNivelLabel(inscricao.jogadorNivel)}</Nivel>
                    )}
                  </Dados>
                </Jogador>
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
        </div>
      )}

      <LoadingOverlay isLoading={!!operacao} message={operacao ?? ""} />
    </Container>
  );
};
