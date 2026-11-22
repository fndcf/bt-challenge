/**
 * Administrador de arenas (o id do documento é o uid do Firebase Auth)
 */
export interface Admin {
  uid: string;
  email: string;
  role: string;
  /** Cadastros antigos têm só uma arena: o repository entrega sempre a lista */
  arenaIds: string[];
  defaultArenaId?: string;
}

export interface CriarAdminDTO {
  uid: string;
  email: string;
  arenaId: string;
}
