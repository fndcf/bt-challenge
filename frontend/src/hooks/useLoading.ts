/**
 * Hook para gerenciar loading state
 */

import { useState, useCallback } from "react";

export const useLoading = (initialState: boolean = false) => {
  const [loading, setLoading] = useState<boolean>(initialState);

  const startLoading = useCallback(() => setLoading(true), []);
  const stopLoading = useCallback(() => setLoading(false), []);

  return { loading, startLoading, stopLoading, setLoading };
};

export default useLoading;
