/**
 * Hook para título da página
 */

import { useEffect } from "react";

export const useDocumentTitle = (title: string) => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${title} | Dupley`;

    return () => {
      document.title = prevTitle;
    };
  }, [title]);
};

export default useDocumentTitle;
