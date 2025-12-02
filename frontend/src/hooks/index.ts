/**
 * hooks/index.ts
 * Exportações centralizadas de todos os hooks
 *
 * Estrutura:
 * ├── useArenaLoader.ts    - Lógica de carregamento de arena por rota
 * ├── useArenaPublica.ts   - Gerenciar dados públicos da arena
 * ├── useDetalhesEtapa.ts  - Gerenciar detalhes de etapa
 * ├── useAsync.ts          - Gerenciar estado async
 * ├── useClickOutside.ts   - Detectar clique fora de elemento
 * ├── useClipboard.ts      - Copiar para clipboard
 * ├── useDebounce.ts       - Debounce de valores
 * ├── useDocumentTitle.ts  - Título da página
 * ├── useForm.ts           - Gerenciar formulários
 * ├── useLoading.ts        - Gerenciar loading state
 * ├── useLocalStorage.ts   - LocalStorage reativo
 * └── useMediaQuery.ts     - Detectar tamanho da tela
 */

// Roteamento e Arena
export { useArenaLoader, extractArenaSlug, isAdminRoute } from "./useArenaLoader";
export { useArenaPublica } from "./useArenaPublica";
export { useDetalhesEtapa } from "./useDetalhesEtapa";

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
