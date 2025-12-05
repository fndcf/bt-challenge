/**
 * Exportações centralizadas de todos os hooks
 */

// Roteamento e Arena
export {
  useArenaLoader,
  extractArenaSlug,
  isAdminRoute,
} from "./useArenaLoader";
export { useArenaPublica } from "./useArenaPublica";

// Detalhes de Etapa
export { useDetalhesEtapa } from "./useDetalhesEtapa";
export { useEtapaData } from "./useEtapaData";
export { useEtapaInscricoes } from "./useEtapaInscricoes";
export { useEtapaChaves } from "./useEtapaChaves";
export { useEtapaUI } from "./useEtapaUI";

// Estado
export { useLoading } from "./useLoading";
export { useAsync } from "./useAsync";
export { useLocalStorage } from "./useLocalStorage";

// Formulários
export { useForm } from "./useForm";

// UI
export { useDebounce } from "./useDebounce";
export { useClickOutside } from "./useClickOutside";
export { useMediaQuery } from "./useMediaQuery";
export { useClipboard } from "./useClipboard";
export { useDocumentTitle } from "./useDocumentTitle";
