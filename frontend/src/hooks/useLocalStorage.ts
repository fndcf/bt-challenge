/**
 * useLocalStorage.ts
 * Hook para localStorage
 */

import { useState } from "react";
import logger from "../utils/logger";

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

export default useLocalStorage;
