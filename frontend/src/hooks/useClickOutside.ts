/**
 * useClickOutside.ts
 * Hook para detectar clique fora de um elemento
 *
 * Corrigido: Cleanup function agora funciona corretamente
 */

import { useEffect, useRef, useCallback } from "react";

export const useClickOutside = <T extends HTMLElement = HTMLElement>(
  callback: () => void
) => {
  const ref = useRef<T | null>(null);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    },
    [callback]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [handleClick]);

  return ref;
};

export default useClickOutside;
