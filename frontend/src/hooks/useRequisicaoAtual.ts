/**
 * Descarta resposta velha em listas com filtro
 *
 * Cada mudança de filtro dispara uma requisição; elas podem voltar fora de
 * ordem. Sem isso, a resposta de um filtro antigo que chega por último
 * sobrescreve a lista certa.
 *
 *   const requisicao = useRequisicaoAtual();
 *   const carregar = async () => {
 *     const minha = requisicao.iniciar();
 *     const dados = await service.listar(filtros);
 *     if (!requisicao.ehAtual(minha)) return;
 *     setLista(dados);
 *   };
 */

import { useMemo, useRef } from "react";

export function useRequisicaoAtual() {
  const ultima = useRef(0);

  // Mesmo objeto em todo render: pode entrar nas dependências de useCallback
  return useMemo(
    () => ({
      iniciar: () => ++ultima.current,
      ehAtual: (numero: number) => numero === ultima.current,
    }),
    []
  );
}
