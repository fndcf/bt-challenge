/**
 * Modal para substituir jogador após geração de chaves
 */

import React, { useEffect, useState } from "react";
import styled, { css } from "styled-components";
import {
  LinhaJogador,
  ListaDeJogadores,
} from "@/components/jogadores/LinhaJogador";
import { Alert, Button, Input, Modal } from "@/components/ui";
import { getEtapaService } from "@/services";
import { theme } from "@/styles/theme";
import { Inscricao } from "@/types/etapa";
import { getMensagemErro } from "@/utils/erro";

interface JogadorDisponivel {
  id: string;
  nome: string;
  nivel: string;
  genero: string;
}

interface ModalSubstituirJogadorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  etapaId: string;
  inscricoes: Inscricao[];
}

// ============== STYLED COMPONENTS ==============

const { texto, acao } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

const Conteudo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
`;

const Descricao = styled.p`
  margin: 0;
  font-size: ${fontSize.sm};
  color: ${texto.secundario};
`;

const Colunas = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: ${theme.spacing[4]};
`;

// No celular, uma escolha por vez: a segunda lista aparece depois da primeira
const Coluna = styled.section<{ $depois: boolean }>`
  ${({ $depois }) =>
    $depois &&
    css`
      @media (max-width: ${theme.breakpoints.sm}) {
        display: none !important;
      }
    `}

  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[2]};
  min-width: 0;
`;

const ColunaTitulo = styled.h4`
  margin: 0;
  font-size: ${fontSize.sm};
  font-weight: ${fontWeight.semibold};
  color: ${texto.principal};
`;

// No celular a lista rola com o modal (sem rolagem dentro de rolagem)
const Lista = styled.div`
  @media (min-width: ${theme.breakpoints.sm}) {
    max-height: 18rem;
    overflow-y: auto;
  }
`;

const Escolhido = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[3]};
  min-height: 48px;
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  border: 1px solid ${acao.primaria};
  border-radius: ${theme.borderRadius.lg};
  background: ${acao.fundoClaro};
  color: ${texto.principal};

  strong {
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

const Vazio = styled.p`
  margin: 0;
  padding: ${theme.spacing[8]} ${theme.spacing[4]};
  text-align: center;
  font-size: ${fontSize.sm};
  color: ${texto.secundario};
`;

// ============== LISTA DE ESCOLHA ==============

interface ColunaJogadoresProps {
  titulo: string;
  jogadores: JogadorDisponivel[];
  selecionadoId: string | null;
  onSelecionar: (id: string | null) => void;
  vazio: string;
  carregando?: boolean;
  /** Escondida no celular até a escolha anterior */
  depois?: boolean;
}

const ColunaJogadores: React.FC<ColunaJogadoresProps> = ({
  titulo,
  jogadores,
  selecionadoId,
  onSelecionar,
  vazio,
  carregando = false,
  depois = false,
}) => {
  const [busca, setBusca] = useState("");

  const listados = jogadores
    .filter((j) => j.nome.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const escolhido = jogadores.find((j) => j.id === selecionadoId);

  return (
    <Coluna $depois={depois} aria-label={titulo}>
      <ColunaTitulo>{titulo}</ColunaTitulo>
      {escolhido ? (
        <Escolhido>
          <strong>{escolhido.nome}</strong>
          <Button
            variant="outline"
            size="sm"
            // Ao escolher, a linha clicada some: o foco vem para cá
            autoFocus
            aria-label={`Trocar ${escolhido.nome}`}
            onClick={() => onSelecionar(null)}
          >
            Trocar
          </Button>
        </Escolhido>
      ) : (
        <>
          <Input
            type="search"
            aria-label={`Buscar em ${titulo}`}
            fullWidth
            placeholder="Buscar jogador..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <Lista>
            {carregando || listados.length === 0 ? (
              <Vazio>{carregando ? "Carregando jogadores..." : vazio}</Vazio>
            ) : (
              <ListaDeJogadores>
                {listados.map((jogador) => (
                  <LinhaJogador
                    key={jogador.id}
                    nome={jogador.nome}
                    nivel={jogador.nivel}
                    genero={jogador.genero}
                    onEscolher={() => onSelecionar(jogador.id)}
                  />
                ))}
              </ListaDeJogadores>
            )}
          </Lista>
        </>
      )}
    </Coluna>
  );
};

// ============== COMPONENTE ==============

export const ModalSubstituirJogador: React.FC<ModalSubstituirJogadorProps> = ({
  isOpen,
  onClose,
  onSuccess,
  etapaId,
  inscricoes,
}) => {
  const [disponiveis, setDisponiveis] = useState<JogadorDisponivel[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [antigoId, setAntigoId] = useState<string | null>(null);
  const [novoId, setNovoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setAntigoId(null);
      setNovoId(null);
      setError(null);
      return;
    }

    const carregarDisponiveis = async () => {
      try {
        setCarregando(true);
        setDisponiveis(
          await getEtapaService().buscarJogadoresDisponiveis(etapaId)
        );
      } catch (err) {
        setError(getMensagemErro(err, "Erro ao carregar jogadores disponíveis"));
      } finally {
        setCarregando(false);
      }
    };

    carregarDisponiveis();
  }, [isOpen, etapaId]);

  if (!isOpen) return null;

  const inscritos: JogadorDisponivel[] = inscricoes.map((inscricao) => ({
    id: inscricao.jogadorId,
    nome: inscricao.jogadorNome,
    nivel: inscricao.jogadorNivel,
    genero: inscricao.jogadorGenero,
  }));

  const handleConfirm = async () => {
    if (!antigoId || !novoId) return;

    try {
      setLoading(true);
      setError(null);
      await getEtapaService().substituirJogador(etapaId, antigoId, novoId);
      onSuccess();
    } catch (err) {
      setError(getMensagemErro(err, "Erro ao substituir jogador"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Substituir Jogador"
      size="lg"
      loading={loading}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!antigoId || !novoId}
            loading={loading}
          >
            {loading ? "Substituindo..." : "Confirmar Substituição"}
          </Button>
        </>
      }
    >
      <Conteudo>
        <Descricao>
          Escolha quem sai e quem entra. Só é possível substituir antes de qualquer partida ser jogada.
        </Descricao>

        {error && (
          <div role="alert">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        <Colunas>
          <ColunaJogadores
            titulo="Jogador a ser substituído"
            jogadores={inscritos}
            selecionadoId={antigoId}
            onSelecionar={setAntigoId}
            vazio="Nenhum jogador encontrado"
          />
          <ColunaJogadores
            titulo="Novo jogador"
            jogadores={disponiveis}
            selecionadoId={novoId}
            onSelecionar={setNovoId}
            vazio="Nenhum jogador disponível"
            carregando={carregando}
            depois={!antigoId}
          />
        </Colunas>
      </Conteudo>
    </Modal>
  );
};

export default ModalSubstituirJogador;
