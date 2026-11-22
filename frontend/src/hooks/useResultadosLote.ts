/**
 * Placares, erros e salvamento dos modais de resultados em lote
 *
 * Cada formato informa só como enviar (`enviar`) e, se tiver, uma regra própria
 * (`validarPartida`). As mensagens e o fluxo são iguais nos quatro.
 */

import React, { useEffect, useState } from "react";
import {
  CampoSet,
  ChaveSet,
  montarPlacarEnvio,
  montarResultadosIniciais,
  ResultadoPartida,
  resultadoVazio,
  validarResultado,
} from "@/utils/resultadosLote";

type Partidas = Parameters<typeof montarResultadosIniciais>[0];

interface ResultadoEnvio {
  partidaId: string;
  placar: ReturnType<typeof montarPlacarEnvio>;
}

interface RespostaLote {
  processados: number;
  erros?: Array<{ partidaId: string; erro: string }>;
}

interface UseResultadosLoteParams {
  partidas: Partidas;
  melhorDe3: boolean;
  enviar: (resultados: ResultadoEnvio[]) => Promise<RespostaLote>;
  onSuccess: () => void;
  /** Regra do formato, além do placar (ex.: jogadores não definidos) */
  validarPartida?: (partidaId: string) => string | undefined;
}

export const useResultadosLote = ({
  partidas,
  melhorDe3,
  enviar,
  onSuccess,
  validarPartida,
}: UseResultadosLoteParams) => {
  const [resultados, setResultados] = useState<Map<string, ResultadoPartida>>(
    new Map()
  );
  const [erros, setErros] = useState<Map<string, string>>(new Map());
  const [erroGlobal, setErroGlobal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setResultados(montarResultadosIniciais(partidas));
  }, [partidas]);

  const alterarPlacar = (
    partidaId: string,
    chave: ChaveSet,
    campo: CampoSet,
    valor: number | undefined
  ) => {
    setResultados((prev) => {
      const atual = prev.get(partidaId) ?? {
        partidaId,
        set1: {},
        set2: {},
        set3: {},
      };
      return new Map(prev).set(partidaId, {
        ...atual,
        [chave]: { ...atual[chave], [campo]: valor },
      });
    });

    // Ao corrigir, o erro desta partida some
    setErros((prev) => {
      const novos = new Map(prev);
      novos.delete(partidaId);
      return novos;
    });
    setErroGlobal(null);
  };

  const preenchidos = Array.from(resultados.values()).filter(
    (resultado) => !resultadoVazio(resultado, melhorDe3)
  );

  const validar = (): Map<string, string> => {
    const novosErros = new Map<string, string>();
    preenchidos.forEach((resultado) => {
      const erro =
        validarPartida?.(resultado.partidaId) ??
        validarResultado(resultado, melhorDe3);
      if (erro) novosErros.set(resultado.partidaId, erro);
    });
    return novosErros;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroGlobal(null);

    const errosValidacao = validar();
    setErros(errosValidacao);
    if (errosValidacao.size > 0) {
      setErroGlobal(
        `${errosValidacao.size} partida(s) com erro de validação. Corrija as partidas destacadas.`
      );
      return;
    }

    if (preenchidos.length === 0) {
      setErroGlobal("Nenhum resultado foi preenchido");
      return;
    }

    try {
      setLoading(true);
      const { processados, erros: errosApi = [] } = await enviar(
        preenchidos.map((resultado) => ({
          partidaId: resultado.partidaId,
          placar: montarPlacarEnvio(resultado, melhorDe3),
        }))
      );

      if (errosApi.length > 0) {
        setErros(new Map(errosApi.map((item) => [item.partidaId, item.erro])));
        setErroGlobal(
          processados > 0
            ? `${processados} resultado(s) salvo(s), mas ${errosApi.length} erro(s) encontrado(s).`
            : "Nenhum resultado foi salvo. Verifique os erros."
        );
        return;
      }

      alert(`${processados} resultado(s) salvo(s) com sucesso!`);
      onSuccess();
    } catch (err: any) {
      setErroGlobal(
        err.message || "Erro ao salvar resultados. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    resultados,
    erros,
    erroGlobal,
    loading,
    seraoSalvas: preenchidos.length,
    alterarPlacar,
    handleSubmit,
  };
};
