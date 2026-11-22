/**
 * Modal para formação manual de equipes no formato TEAMS
 */

import React, { useMemo, useState } from "react";
import styled from "styled-components";
import {
  CartaoFormacao,
  GradeFormacao,
  JogadoresDisponiveis,
} from "../FormacaoManual";
import { Alert, Button, Modal } from "@/components/ui";
import { theme } from "@/styles/theme";
import { FormatoEtapa, Inscricao, VarianteTeams } from "@/types/etapa";
import { FormacaoManualEquipeDTO } from "@/types/teams";
import { getMensagemErro } from "@/utils/erro";

interface ModalFormacaoManualEquipesProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (formacoes: FormacaoManualEquipeDTO[]) => Promise<void>;
  inscricoes: Inscricao[];
  varianteTeams: VarianteTeams;
  isMisto?: boolean;
}

interface EquipeState {
  nome: string;
  jogadorIds: string[];
}

const { texto, superficie } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[6]};
`;

const EquipeNome = styled.input`
  flex: 1;
  min-width: 0;
  min-height: 36px;
  padding: 0 ${theme.spacing[2]};
  border: 1px solid transparent;
  border-radius: ${theme.borderRadius.md};
  background: ${superficie.sobreposicaoEscura};
  color: ${texto.inverso};
  font-family: inherit;
  font-size: ${fontSize.base};
  font-weight: ${fontWeight.semibold};

  &::placeholder {
    color: ${texto.inverso};
  }

  &:focus-visible {
    outline: 2px solid ${texto.inverso};
    outline-offset: 1px;
  }
`;

export const ModalFormacaoManualEquipes: React.FC<
  ModalFormacaoManualEquipesProps
> = ({
  isOpen,
  onClose,
  onConfirm,
  inscricoes,
  varianteTeams,
  isMisto = false,
}) => {
  const jogadoresPorEquipe = varianteTeams;
  const numEquipes = Math.floor(inscricoes.length / jogadoresPorEquipe);
  const porGenero = jogadoresPorEquipe / 2;

  const [equipes, setEquipes] = useState<EquipeState[]>(() =>
    Array.from({ length: numEquipes }, (_, i) => ({
      nome: `Equipe ${i + 1}`,
      jogadorIds: [],
    }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const porJogador = useMemo(
    () => new Map(inscricoes.map((i) => [i.jogadorId, i])),
    [inscricoes]
  );

  const alocados = new Set(equipes.flatMap((equipe) => equipe.jogadorIds));
  const disponiveis = inscricoes.filter(
    (i) => i.status === "confirmada" && !alocados.has(i.jogadorId)
  );
  const primeiraIncompleta = equipes.findIndex(
    (equipe) => equipe.jogadorIds.length < jogadoresPorEquipe
  );
  const todasCompletas = primeiraIncompleta === -1;

  const alterarEquipe = (
    indice: number,
    alterar: (equipe: EquipeState) => Partial<EquipeState>
  ) =>
    setEquipes((prev) =>
      prev.map((equipe, i) =>
        i === indice ? { ...equipe, ...alterar(equipe) } : equipe
      )
    );

  const contarGenero = (equipe: EquipeState, genero: string) =>
    equipe.jogadorIds.filter(
      (id) => porJogador.get(id)?.jogadorGenero === genero
    ).length;

  const handleConfirm = async () => {
    if (isMisto) {
      const desequilibrada = equipes.find(
        (equipe) =>
          contarGenero(equipe, "masculino") !== porGenero ||
          contarGenero(equipe, "feminino") !== porGenero
      );
      if (desequilibrada) {
        setError(
          `${desequilibrada.nome}: Para formato misto, cada equipe deve ter ${porGenero} homens e ${porGenero} mulheres`
        );
        return;
      }
    }

    setError(null);
    setLoading(true);

    try {
      await onConfirm(equipes);
    } catch (err) {
      setError(getMensagemErro(err, "Erro ao formar equipes"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Formar Equipes Manualmente"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!todasCompletas || loading}
            loading={loading}
          >
            {loading ? "Formando..." : "Formar Equipes"}
          </Button>
        </>
      }
      closeOnOverlayClick={false}
      loading={loading}
    >
      <Container>
        <Alert
          title={`TEAMS ${varianteTeams} - ${numEquipes} equipes de ${jogadoresPorEquipe} jogadores`}
        >
          Clique nos jogadores disponíveis para adicioná-los a uma equipe.
          {isMisto &&
            ` Cada equipe deve ter ${porGenero} homens e ${porGenero} mulheres.`}
        </Alert>

        {error && (
          <div role="alert">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        <GradeFormacao>
          {equipes.map((equipe, indice) => (
            <CartaoFormacao
              key={indice}
              formato={FormatoEtapa.TEAMS}
              titulo={
                <EquipeNome
                  value={equipe.nome}
                  onChange={(e) =>
                    alterarEquipe(indice, () => ({ nome: e.target.value }))
                  }
                  placeholder="Nome da equipe"
                  aria-label={`Nome da equipe ${indice + 1}`}
                />
              }
              jogadores={equipe.jogadorIds.map((id) => porJogador.get(id))}
              tamanho={jogadoresPorEquipe}
              isMisto={isMisto}
              onRemover={(jogadorId) =>
                alterarEquipe(indice, ({ jogadorIds }) => ({
                  jogadorIds: jogadorIds.filter((id) => id !== jogadorId),
                }))
              }
            />
          ))}
        </GradeFormacao>

        <JogadoresDisponiveis
          jogadores={disponiveis}
          isMisto={isMisto}
          onEscolher={(jogadorId) =>
            alterarEquipe(primeiraIncompleta, ({ jogadorIds }) => ({
              jogadorIds: [...jogadorIds, jogadorId],
            }))
          }
          desabilitado={todasCompletas}
        />
      </Container>
    </Modal>
  );
};

export default ModalFormacaoManualEquipes;
