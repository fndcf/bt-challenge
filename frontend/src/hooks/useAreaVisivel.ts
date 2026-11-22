/**
 * Área da tela que sobra acima do teclado do celular
 *
 * No iPhone o teclado cobre a página sem mudar o tamanho dela: um elemento fixo
 * no rodapé (modal) fica escondido atrás. O visualViewport diz o que está à vista.
 */

import { useEffect, useState } from "react";

export interface AreaVisivel {
  top: number;
  bottom: number;
}

/** Abaixo disso é a barra do navegador, não o teclado */
const ALTURA_MINIMA_TECLADO = 120;

/** Distâncias até as bordas da tela, ou null sem teclado aberto */
export const useAreaVisivel = (ativo: boolean): AreaVisivel | null => {
  const [area, setArea] = useState<AreaVisivel | null>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!ativo || !viewport) return;

    const atualizar = () => {
      const alturaPagina = document.documentElement.clientHeight;
      // Com zoom (pinça) a área também encolhe, mas não é teclado
      const temTeclado =
        viewport.scale <= 1.01 &&
        alturaPagina - viewport.height > ALTURA_MINIMA_TECLADO;

      setArea(
        temTeclado
          ? {
              top: viewport.offsetTop,
              bottom: Math.max(
                0,
                alturaPagina - viewport.offsetTop - viewport.height
              ),
            }
          : null
      );
    };

    atualizar();
    viewport.addEventListener("resize", atualizar);
    viewport.addEventListener("scroll", atualizar);
    return () => {
      viewport.removeEventListener("resize", atualizar);
      viewport.removeEventListener("scroll", atualizar);
      setArea(null);
    };
  }, [ativo]);

  return area;
};

export default useAreaVisivel;
