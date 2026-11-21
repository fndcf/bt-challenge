/**
 * Modal para o admin resolver um empate de grupo:
 * sortear a ordem ou escolher manualmente quem fica em cada posição.
 */

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Modal, Button } from "@/components/ui";
import { getEtapaService } from "@/services";
import {
  EmpatePendente,
  ModoDesempate,
  ParticipanteEmpate,
  ResultadoDesempate,
} from "@/types/etapa";

interface ModalResolverEmpateProps {
  etapaId: string;
  empate: EmpatePendente;
  onClose: () => void;
  onResolvido: () => void | Promise<void>;
}

// ============== STYLES ==============

const Descricao = styled.p`
  margin: 0 0 1.25rem 0;
  color: #374151;
  font-size: 0.9375rem;
  line-height: 1.5;

  strong {
    color: #111827;
  }
`;

const Contexto = styled.p`
  margin: -0.5rem 0 1.25rem 0;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
  font-size: 0.8125rem;
  line-height: 1.5;
`;

const Opcoes = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1.25rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const Opcao = styled.button<{ $ativa: boolean }>`
  text-align: left;
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  border: 2px solid ${({ $ativa }) => ($ativa ? "#7c3aed" : "#e5e7eb")};
  background: ${({ $ativa }) => ($ativa ? "#f5f3ff" : "#ffffff")};
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: #a78bfa;
  }

  strong {
    display: block;
    color: #111827;
    font-size: 0.9375rem;
    margin-bottom: 0.25rem;
  }

  span {
    color: #6b7280;
    font-size: 0.8125rem;
    line-height: 1.4;
  }
`;

const Lista = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ItemLista = styled.li`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.625rem;
  background: #f9fafb;
`;

const Posicao = styled.span`
  min-width: 2.25rem;
  height: 2.25rem;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 700;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Nome = styled.span`
  flex: 1;
  font-weight: 500;
  color: #111827;
  font-size: 0.9375rem;
`;

const Setas = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const Seta = styled.button`
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #374151;
  font-size: 1rem;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #f3f4f6;
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

const Subtitulo = styled.h4`
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`;

const Erro = styled.div`
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  font-size: 0.875rem;
`;

// ============== HELPERS ==============

const posicoesDisputadas = (empate: EmpatePendente): string => {
  const posicoes = empate.participantes.map(
    (_, i) => `${empate.posicaoInicial + i}º`
  );
  return posicoes.length === 2
    ? `${posicoes[0]} e ${posicoes[1]}`
    : `${posicoes.slice(0, -1).join(", ")} e ${posicoes[posicoes.length - 1]}`;
};

const listarNomes = (participantes: ParticipanteEmpate[]): string => {
  const nomes = participantes.map((p) => p.nome);
  return nomes.length === 2
    ? `${nomes[0]} e ${nomes[1]}`
    : `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
};

// ============== COMPONENTE ==============

export const ModalResolverEmpate: React.FC<ModalResolverEmpateProps> = ({
  etapaId,
  empate,
  onClose,
  onResolvido,
}) => {
  const etapaService = getEtapaService();
  const [modo, setModo] = useState<ModoDesempate>("sorteio");
  const [ordem, setOrdem] = useState<ParticipanteEmpate[]>(empate.participantes);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultadoSorteio, setResultadoSorteio] =
    useState<ResultadoDesempate | null>(null);

  useEffect(() => {
    setModo("sorteio");
    setOrdem(empate.participantes);
    setErro(null);
    setResultadoSorteio(null);
  }, [empate]);

  const mover = (indice: number, direcao: -1 | 1) => {
    setOrdem((atual) => {
      const nova = [...atual];
      const destino = indice + direcao;
      [nova[indice], nova[destino]] = [nova[destino], nova[indice]];
      return nova;
    });
  };

  const handleConfirmar = async () => {
    try {
      setSalvando(true);
      setErro(null);

      const resultado = await etapaService.resolverEmpate(etapaId, {
        grupoId: empate.grupoId,
        ids: (modo === "manual" ? ordem : empate.participantes).map((p) => p.id),
        modo,
      });

      if (modo === "sorteio") {
        // Mostra o resultado antes de fechar
        setResultadoSorteio(resultado);
      } else {
        await onResolvido();
      }
    } catch (err: any) {
      setErro(err.message || "Erro ao resolver empate");
    } finally {
      setSalvando(false);
    }
  };

  const renderPosicoes = (
    participantes: ParticipanteEmpate[],
    editavel: boolean
  ) => (
    <Lista>
      {participantes.map((participante, i) => (
        <ItemLista key={participante.id}>
          <Posicao>{empate.posicaoInicial + i}º</Posicao>
          <Nome>{participante.nome}</Nome>
          {editavel && (
            <Setas>
              <Seta
                type="button"
                onClick={() => mover(i, -1)}
                disabled={i === 0 || salvando}
                aria-label={`Subir ${participante.nome}`}
              >
                ↑
              </Seta>
              <Seta
                type="button"
                onClick={() => mover(i, 1)}
                disabled={i === participantes.length - 1 || salvando}
                aria-label={`Descer ${participante.nome}`}
              >
                ↓
              </Seta>
            </Setas>
          )}
        </ItemLista>
      ))}
    </Lista>
  );

  if (resultadoSorteio) {
    return (
      <Modal
        isOpen
        onClose={onResolvido}
        title={`Resultado do sorteio — ${empate.grupoNome}`}
        size="sm"
        footer={
          <Button variant="primary" onClick={onResolvido}>
            Fechar
          </Button>
        }
      >
        <Descricao>A classificação do grupo foi atualizada:</Descricao>
        {renderPosicoes(resultadoSorteio.participantes, false)}
      </Modal>
    );
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Empate no ${empate.grupoNome}`}
      size="md"
      loading={salvando}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={salvando}>
            Decidir depois
          </Button>
          <Button variant="primary" onClick={handleConfirmar} loading={salvando}>
            {modo === "sorteio" ? "Sortear" : "Confirmar ordem"}
          </Button>
        </>
      }
    >
      <Descricao>
        <strong>{listarNomes(empate.participantes)}</strong> empataram em todos
        os critérios de desempate e disputam o{" "}
        <strong>{posicoesDisputadas(empate)} lugar</strong>. Como deseja definir
        a ordem?
      </Descricao>

      {empate.contexto && <Contexto>{empate.contexto}</Contexto>}

      <Opcoes role="radiogroup" aria-label="Forma de desempate">
        <Opcao
          type="button"
          role="radio"
          aria-checked={modo === "sorteio"}
          $ativa={modo === "sorteio"}
          onClick={() => setModo("sorteio")}
          disabled={salvando}
        >
          <strong>Sortear</strong>
          <span>O sistema define a ordem aleatoriamente.</span>
        </Opcao>
        <Opcao
          type="button"
          role="radio"
          aria-checked={modo === "manual"}
          $ativa={modo === "manual"}
          onClick={() => setModo("manual")}
          disabled={salvando}
        >
          <strong>Escolher a ordem</strong>
          <span>Você define quem fica em cada posição.</span>
        </Opcao>
      </Opcoes>

      {modo === "manual" && (
        <>
          <Subtitulo>Ordem final</Subtitulo>
          {renderPosicoes(ordem, true)}
        </>
      )}

      {erro && <Erro role="alert">{erro}</Erro>}
    </Modal>
  );
};

export default ModalResolverEmpate;
