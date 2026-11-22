/**
 * Modal para o admin resolver um empate de grupo:
 * sortear a ordem ou escolher manualmente quem fica em cada posição.
 */

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  IconButton,
  Modal,
  OpcoesCartao,
} from "@/components/ui";
import { getEtapaService } from "@/services";
import { theme } from "@/styles/theme";
import {
  EmpatePendente,
  ModoDesempate,
  ParticipanteEmpate,
  ResultadoDesempate,
} from "@/types/etapa";
import { getMensagemErro } from "@/utils/erro";

interface ModalResolverEmpateProps {
  etapaId: string;
  empate: EmpatePendente;
  onClose: () => void;
  onResolvido: () => void | Promise<void>;
}

// ============== STYLES ==============

const { texto, superficie } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

const Conteudo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
`;

const Descricao = styled.p`
  margin: 0;
  line-height: 1.5;
  color: ${texto.secundario};

  strong {
    color: ${texto.principal};
  }
`;

const Lista = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[2]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const ItemLista = styled.li`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
  min-height: 48px;
  padding: ${theme.spacing[1]} ${theme.spacing[2]} ${theme.spacing[1]}
    ${theme.spacing[3]};
  border: 1px solid ${superficie.borda};
  border-radius: ${theme.borderRadius.md};
  background: ${superficie.fundoAlternativo};
  color: ${texto.secundario};
`;

const Nome = styled.span`
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
  font-weight: ${fontWeight.medium};
  color: ${texto.principal};
`;

const Subtitulo = styled.h4`
  margin: 0;
  font-size: ${fontSize.sm};
  font-weight: ${fontWeight.semibold};
  color: ${texto.principal};
`;

// ============== HELPERS ==============

/** "A, B e C" */
const juntar = (itens: string[]): string =>
  `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;

const OPCOES: { valor: ModoDesempate; titulo: string; descricao: string }[] = [
  {
    valor: "sorteio",
    titulo: "Sortear",
    descricao: "O sistema define a ordem aleatoriamente.",
  },
  {
    valor: "manual",
    titulo: "Escolher a ordem",
    descricao: "Você define quem fica em cada posição.",
  },
];

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
    } catch (err) {
      setErro(getMensagemErro(err, "Erro ao resolver empate"));
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
          <Badge tom="info">{`${empate.posicaoInicial + i}º`}</Badge>
          <Nome>{participante.nome}</Nome>
          {editavel && (
            <>
              <IconButton
                rotulo={`Subir ${participante.nome}`}
                icone={<ArrowUp aria-hidden="true" />}
                onClick={() => mover(i, -1)}
                disabled={i === 0 || salvando}
              />
              <IconButton
                rotulo={`Descer ${participante.nome}`}
                icone={<ArrowDown aria-hidden="true" />}
                onClick={() => mover(i, 1)}
                disabled={i === participantes.length - 1 || salvando}
              />
            </>
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
        <Conteudo>
          <Descricao>A classificação do grupo foi atualizada:</Descricao>
          {renderPosicoes(resultadoSorteio.participantes, false)}
        </Conteudo>
      </Modal>
    );
  }

  const posicoes = empate.participantes.map(
    (_, i) => `${empate.posicaoInicial + i}º`
  );

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
      <Conteudo>
        <Descricao>
          <strong>{juntar(empate.participantes.map((p) => p.nome))}</strong>{" "}
          empataram em todos os critérios de desempate e disputam o{" "}
          <strong>{juntar(posicoes)} lugar</strong>. Como deseja definir a
          ordem?
        </Descricao>

        {empate.contexto && <Alert>{empate.contexto}</Alert>}

        <OpcoesCartao
          rotulo="Forma de desempate"
          opcoes={OPCOES}
          valor={modo}
          onChange={setModo}
          disabled={salvando}
        />

        {modo === "manual" && (
          <>
            <Subtitulo>Ordem final</Subtitulo>
            {renderPosicoes(ordem, true)}
          </>
        )}

        {erro && (
          <div role="alert">
            <Alert variant="error">{erro}</Alert>
          </div>
        )}
      </Conteudo>
    </Modal>
  );
};

export default ModalResolverEmpate;
