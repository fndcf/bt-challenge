/**
 * Hook para copiar para clipboard
 */

import { useState } from "react";
import logger from "../utils/logger";

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

export default useClipboard;
