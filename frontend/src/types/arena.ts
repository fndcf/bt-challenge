export interface Arena {
  id: string;
  nome: string;
  slug: string;
  ativa: boolean;
  // Só vêm para o administrador da arena
  adminEmail?: string;
  adminUid?: string;
  createdAt?: string;
  updatedAt?: string;
}
