import chaveService from "@/services/chaveService";
import { Grupo } from "@/types";
import { useState, useEffect } from "react";
import { CardGrupo } from "./CardGrupo";

interface FaseGruposProps {
  etapaId: string;
  grupos: Grupo[];
  onAtualizarGrupos: () => void;
}

export const FaseGrupos: React.FC<FaseGruposProps> = ({
  etapaId,
  grupos,
  onAtualizarGrupos,
}) => {
  const [temEliminatoria, setTemEliminatoria] = useState(false);
  const [verificandoEliminatoria, setVerificandoEliminatoria] = useState(true);

  // ============== VERIFICAR SE TEM ELIMINATÓRIA ==============
  useEffect(() => {
    verificarEliminatoria();
  }, [etapaId]);

  const verificarEliminatoria = async () => {
    try {
      setVerificandoEliminatoria(true);
      const confrontos = await chaveService.buscarConfrontosEliminatorios(
        etapaId
      );
      setTemEliminatoria(confrontos && confrontos.length > 0);
    } catch (error) {
      console.error("Erro ao verificar eliminatória:", error);
      setTemEliminatoria(false);
    } finally {
      setVerificandoEliminatoria(false);
    }
  };
  // ==========================================================

  // Renderizar aviso se tiver eliminatória
  return (
    <div className="space-y-6">
      {/* ============== AVISO SE ELIMINATÓRIA CRIADA ============== */}
      {temEliminatoria && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-yellow-800 mb-1">
                Fase eliminatória já foi gerada
              </h3>
              <p className="text-yellow-700 text-sm">
                A edição de resultados da fase de grupos foi bloqueada. Se
                precisar fazer ajustes, cancele a fase eliminatória primeiro na
                aba "🏆 Eliminatória".
              </p>
            </div>
          </div>
        </div>
      )}
      {/* ======================================================== */}

      {/* Grupos */}
      {grupos.map((grupo) => (
        <CardGrupo
          key={grupo.id}
          grupo={grupo}
          etapaId={etapaId}
          onAtualizar={onAtualizarGrupos}
          bloqueado={temEliminatoria} // ← PASSAR PROP
        />
      ))}
    </div>
  );
};
