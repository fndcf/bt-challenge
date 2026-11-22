/**
 * Modal para formação manual de equipes no formato TEAMS
 * Permite ao organizador arrastar/selecionar jogadores para cada equipe
 */

import React, { useState, useMemo } from "react";
import styled from "styled-components";
import { X } from "lucide-react";
import { Alert, Badge, Button, IconButton, Modal } from "@/components/ui";
import { getNivelAbrev } from "@/utils/formatters";
import {
  FiltroGenero,
  passaNoFiltroGenero,
  SeloGenero,
  ValorFiltroGenero,
} from "@/components/jogadores/Genero";
import { theme } from "@/styles/theme";
import { getCoresFormato } from "@/styles/semantic";
import { Inscricao } from "@/types/etapa";
import { FormatoEtapa, VarianteTeams } from "@/types/etapa";
import { FormacaoManualEquipeDTO } from "@/types/teams";

interface ModalFormacaoManualEquipesProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (formacoes: FormacaoManualEquipeDTO[]) => Promise<void>;
  inscricoes: Inscricao[];
  varianteTeams: VarianteTeams;
  isMisto?: boolean;
}

// ============== STYLED COMPONENTS ==============

const { texto, superficie, acao, status } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[6]};
`;

const EquipesContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr));
  gap: ${theme.spacing[4]};
`;

const EquipeCard = styled.div<{ $completa: boolean }>`
  border: 1px solid
    ${({ $completa }) =>
      $completa ? status.sucesso.texto : superficie.borda};
  border-radius: ${theme.borderRadius.lg};
  background: ${superficie.fundo};
  overflow: hidden;
`;

const EquipeHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[2]};
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  background: ${getCoresFormato(FormatoEtapa.TEAMS).solido};
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

const EquipeBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[2]};
  padding: ${theme.spacing[3]};
`;

const JogadorSlot = styled.div<{ $vazio: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[2]};
  min-height: 44px;
  padding: 0 ${theme.spacing[1]} 0 ${theme.spacing[3]};
  border: 1px ${({ $vazio }) => ($vazio ? "dashed" : "solid")}
    ${({ $vazio }) => ($vazio ? superficie.bordaForte : superficie.borda)};
  border-radius: ${theme.borderRadius.md};
  background: ${({ $vazio }) =>
    $vazio ? superficie.fundo : superficie.fundoAlternativo};
  color: ${({ $vazio }) => ($vazio ? texto.secundario : texto.principal)};
  font-size: ${fontSize.sm};
`;

const JogadorInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing[2]};
  min-width: 0;
`;

const SectionTitle = styled.h4`
  margin: 0 0 ${theme.spacing[3]} 0;
  font-size: ${fontSize.sm};
  font-weight: ${fontWeight.semibold};
  color: ${texto.principal};
`;

const JogadoresList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing[2]};
  max-height: 14rem;
  overflow-y: auto;
  font-size: ${fontSize.sm};
  color: ${texto.secundario};
`;

const Filtro = styled.div`
  margin-bottom: ${theme.spacing[3]};
`;

const JogadorChip = styled.button`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
  min-height: 40px;
  padding: ${theme.spacing[1]} ${theme.spacing[3]};
  border: 1px solid ${superficie.bordaForte};
  border-radius: ${theme.borderRadius.full};
  background: ${superficie.fundo};
  color: ${texto.principal};
  font-family: inherit;
  font-size: ${fontSize.sm};
  font-weight: ${fontWeight.medium};
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${acao.primaria};
    background: ${acao.fundoClaro};
  }

  &:focus-visible {
    outline: 2px solid ${acao.primaria};
    outline-offset: 1px;
  }

  &:disabled {
    color: ${texto.desabilitado};
    cursor: not-allowed;
  }
`;

// ============== COMPONENTE ==============

interface EquipeState {
  nome: string;
  jogadorIds: string[];
}

export const ModalFormacaoManualEquipes: React.FC<ModalFormacaoManualEquipesProps> = ({
  isOpen,
  onClose,
  onConfirm,
  inscricoes,
  varianteTeams,
  isMisto = false,
}) => {
  const jogadoresPorEquipe = varianteTeams;
  const numEquipes = Math.floor(inscricoes.length / jogadoresPorEquipe);

  // Estado das equipes
  const [equipes, setEquipes] = useState<EquipeState[]>(() =>
    Array.from({ length: numEquipes }, (_, i) => ({
      nome: `Equipe ${i + 1}`,
      jogadorIds: [],
    }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtroGenero, setFiltroGenero] = useState<ValorFiltroGenero>("todos");

  // Jogadores já alocados
  const jogadoresAlocados = useMemo(() => {
    const ids = new Set<string>();
    equipes.forEach((eq) => eq.jogadorIds.forEach((id) => ids.add(id)));
    return ids;
  }, [equipes]);

  // Jogadores disponíveis
  const jogadoresDisponiveis = useMemo(() => {
    return inscricoes.filter(
      (i) => i.status === "confirmada" && !jogadoresAlocados.has(i.jogadorId)
    );
  }, [inscricoes, jogadoresAlocados]);

  const jogadoresListados = jogadoresDisponiveis.filter((i) =>
    passaNoFiltroGenero(i.jogadorGenero, filtroGenero)
  );

  // Mapa de inscrições por ID
  const inscricoesMap = useMemo(() => {
    const map = new Map<string, Inscricao>();
    inscricoes.forEach((i) => map.set(i.jogadorId, i));
    return map;
  }, [inscricoes]);

  // Verificar se todas equipes estão completas
  const todasCompletas = equipes.every(
    (eq) => eq.jogadorIds.length === jogadoresPorEquipe
  );

  // Adicionar jogador à equipe
  const adicionarJogador = (equipeIndex: number, jogadorId: string) => {
    setEquipes((prev) => {
      const newEquipes = [...prev];
      if (newEquipes[equipeIndex].jogadorIds.length < jogadoresPorEquipe) {
        newEquipes[equipeIndex] = {
          ...newEquipes[equipeIndex],
          jogadorIds: [...newEquipes[equipeIndex].jogadorIds, jogadorId],
        };
      }
      return newEquipes;
    });
  };

  // Remover jogador da equipe
  const removerJogador = (equipeIndex: number, jogadorId: string) => {
    setEquipes((prev) => {
      const newEquipes = [...prev];
      newEquipes[equipeIndex] = {
        ...newEquipes[equipeIndex],
        jogadorIds: newEquipes[equipeIndex].jogadorIds.filter(
          (id) => id !== jogadorId
        ),
      };
      return newEquipes;
    });
  };

  // Atualizar nome da equipe
  const atualizarNome = (equipeIndex: number, nome: string) => {
    setEquipes((prev) => {
      const newEquipes = [...prev];
      newEquipes[equipeIndex] = { ...newEquipes[equipeIndex], nome };
      return newEquipes;
    });
  };

  const renderSelos = (inscricao: Inscricao) => (
    <>
      {isMisto && <SeloGenero genero={inscricao.jogadorGenero} />}
      {inscricao.jogadorNivel && (
        <Badge>{getNivelAbrev(inscricao.jogadorNivel)}</Badge>
      )}
    </>
  );

  // Confirmar formação
  const handleConfirm = async () => {
    // Validar
    if (!todasCompletas) {
      setError("Todas as equipes devem ter " + jogadoresPorEquipe + " jogadores");
      return;
    }

    // Validar gênero para misto
    if (isMisto) {
      for (const equipe of equipes) {
        const masculinos = equipe.jogadorIds.filter(
          (id) => inscricoesMap.get(id)?.jogadorGenero === "masculino"
        ).length;
        const femininos = equipe.jogadorIds.filter(
          (id) => inscricoesMap.get(id)?.jogadorGenero === "feminino"
        ).length;

        const esperadoM = jogadoresPorEquipe / 2;
        const esperadoF = jogadoresPorEquipe / 2;

        if (masculinos !== esperadoM || femininos !== esperadoF) {
          setError(
            `${equipe.nome}: Para formato misto, cada equipe deve ter ${esperadoM} homens e ${esperadoF} mulheres`
          );
          return;
        }
      }
    }

    setError(null);
    setLoading(true);

    try {
      const formacoes: FormacaoManualEquipeDTO[] = equipes.map((eq) => ({
        nome: eq.nome,
        jogadorIds: eq.jogadorIds,
      }));

      await onConfirm(formacoes);
    } catch (err: any) {
      setError(err.message || "Erro ao formar equipes");
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
            ` Cada equipe deve ter ${jogadoresPorEquipe / 2} homens e ${
              jogadoresPorEquipe / 2
            } mulheres.`}
        </Alert>

        {error && (
          <div role="alert">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        <EquipesContainer>
          {equipes.map((equipe, equipeIndex) => {
            const isComplete = equipe.jogadorIds.length === jogadoresPorEquipe;

            return (
              <EquipeCard key={equipeIndex} $completa={isComplete}>
                <EquipeHeader>
                  <EquipeNome
                    value={equipe.nome}
                    onChange={(e) => atualizarNome(equipeIndex, e.target.value)}
                    placeholder="Nome da equipe"
                    aria-label={`Nome da equipe ${equipeIndex + 1}`}
                  />
                  <Badge tom={isComplete ? "sucesso" : "neutro"}>
                    {`${equipe.jogadorIds.length}/${jogadoresPorEquipe}`}
                  </Badge>
                </EquipeHeader>

                <EquipeBody>
                  {/* Slots preenchidos */}
                  {equipe.jogadorIds.map((jogadorId) => {
                    const inscricao = inscricoesMap.get(jogadorId);
                    return (
                      <JogadorSlot key={jogadorId} $vazio={false}>
                        <JogadorInfo>
                          <span>{inscricao?.jogadorNome}</span>
                          {inscricao && renderSelos(inscricao)}
                        </JogadorInfo>
                        <IconButton
                          rotulo={`Remover ${inscricao?.jogadorNome}`}
                          title="Remover jogador"
                          tom="perigo"
                          icone={<X aria-hidden="true" />}
                          onClick={() => removerJogador(equipeIndex, jogadorId)}
                        />
                      </JogadorSlot>
                    );
                  })}

                  {/* Slots vazios */}
                  {Array.from({
                    length: jogadoresPorEquipe - equipe.jogadorIds.length,
                  }).map((_, i) => (
                    <JogadorSlot key={`empty-${i}`} $vazio>
                      Clique em um jogador para adicionar
                    </JogadorSlot>
                  ))}
                </EquipeBody>
              </EquipeCard>
            );
          })}
        </EquipesContainer>

        <section>
          <SectionTitle>
            Jogadores Disponíveis ({jogadoresDisponiveis.length})
          </SectionTitle>
          {isMisto && (
            <Filtro>
              <FiltroGenero
                valor={filtroGenero}
                onChange={setFiltroGenero}
                generos={jogadoresDisponiveis.map((i) => i.jogadorGenero)}
              />
            </Filtro>
          )}
          <JogadoresList>
            {jogadoresListados.length === 0 ? (
              <span style={{ color: texto.secundario }}>
                {jogadoresDisponiveis.length === 0
                  ? "Todos os jogadores foram alocados"
                  : "Nenhum jogador disponível com esse filtro"}
              </span>
            ) : (
              jogadoresListados.map((inscricao) => {
                // Encontrar primeira equipe incompleta para adicionar
                const equipeIncompleta = equipes.findIndex(
                  (eq) => eq.jogadorIds.length < jogadoresPorEquipe
                );

                return (
                  <JogadorChip
                    key={inscricao.jogadorId}
                    type="button"
                    onClick={() => {
                      if (equipeIncompleta !== -1) {
                        adicionarJogador(equipeIncompleta, inscricao.jogadorId);
                      }
                    }}
                    disabled={equipeIncompleta === -1}
                  >
                    {inscricao.jogadorNome}
                    {renderSelos(inscricao)}
                  </JogadorChip>
                );
              })
            )}
          </JogadoresList>
        </section>
      </Container>
    </Modal>
  );
};

export default ModalFormacaoManualEquipes;
