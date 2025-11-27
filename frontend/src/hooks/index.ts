import { useState, useEffect, useCallback } from "react";
import logger from "../utils/logger";

/**
 * Hook para gerenciar loading state
 */
export const useLoading = (initialState: boolean = false) => {
  const [loading, setLoading] = useState<boolean>(initialState);

  const startLoading = useCallback(() => setLoading(true), []);
  const stopLoading = useCallback(() => setLoading(false), []);

  return { loading, startLoading, stopLoading, setLoading };
};

/**
 * Hook para gerenciar formulários
 */
export const useForm = <T extends Record<string, any>>(initialValues: T) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const handleChange = (name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Limpar erro quando usuário começa a digitar
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (name: keyof T) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const setFieldError = (name: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const setFieldValue = (name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  const hasErrors = Object.values(errors).some((error) => error !== undefined);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setFieldError,
    setFieldValue,
    setErrors,
    reset,
    hasErrors,
  };
};

/**
 * Hook para debounce de valores
 */
export const useDebounce = <T>(value: T, delay: number = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook para detectar clique fora de um elemento
 */
export const useClickOutside = (callback: () => void) => {
  const ref = useCallback(
    (node: HTMLElement | null) => {
      if (node) {
        const handleClick = (e: MouseEvent) => {
          if (!node.contains(e.target as Node)) {
            callback();
          }
        };

        document.addEventListener("mousedown", handleClick);
        return () => {
          document.removeEventListener("mousedown", handleClick);
        };
      }
    },
    [callback]
  );

  return ref;
};

/**
 * Hook para detectar tamanho da tela
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
};

/**
 * Hook para localStorage
 */
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      logger.error(
        `Erro ao ler localStorage key "${key}"`,
        { key },
        error as Error
      );
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      logger.error(
        `Erro ao salvar localStorage key "${key}"`,
        { key },
        error as Error
      );
    }
  };

  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      logger.error(
        `Erro ao remover localStorage key "${key}"`,
        { key },
        error as Error
      );
    }
  };

  return [storedValue, setValue, removeValue] as const;
};

/**
 * Hook para copiar para clipboard
 */
export const useClipboard = () => {
  const [copied, setCopied] = useState<boolean>(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch (error) {
      logger.error(
        "Erro ao copiar para clipboard",
        { textLength: text.length },
        error as Error
      );
      setCopied(false);
      return false;
    }
  };

  return { copied, copy };
};

/**
 * Hook para gerenciar estado async
 */
export const useAsync = <T, E = string>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true
) => {
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);

  const execute = useCallback(async () => {
    setStatus("pending");
    setData(null);
    setError(null);

    try {
      const response = await asyncFunction();
      setData(response);
      setStatus("success");
      return response;
    } catch (error: any) {
      setError(error.message || "Erro desconhecido");
      setStatus("error");
      throw error;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, data, error, loading: status === "pending" };
};

/**
 * Hook para título da página
 */
export const useDocumentTitle = (title: string) => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${title} | Challenge BT`;

    return () => {
      document.title = prevTitle;
    };
  }, [title]);
};
