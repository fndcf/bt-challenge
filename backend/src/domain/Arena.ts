/**
 * Entidade de domínio Arena
 * Representa uma arena (local/clube) no sistema
 */

export interface ArenaType {
  id: string;
  nome: string;
  slug: string;
  adminEmail: string;
  adminUid: string;
  ativa: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Arena implements ArenaType {
  id: string;
  nome: string;
  slug: string;
  adminEmail: string;
  adminUid: string;
  ativa: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: ArenaType) {
    this.id = data.id;
    this.nome = data.nome;
    this.slug = data.slug;
    this.adminEmail = data.adminEmail;
    this.adminUid = data.adminUid;
    this.ativa = data.ativa;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Obter URL pública da arena
   */
  getPublicUrl(baseUrl: string = "https://challengebt.com.br"): string {
    return `${baseUrl}/arena/${this.slug}`;
  }

  /**
   * Converter para objeto simples (para salvar no Firestore)
   */
  toObject(): ArenaType {
    return {
      id: this.id,
      nome: this.nome,
      slug: this.slug,
      adminEmail: this.adminEmail,
      adminUid: this.adminUid,
      ativa: this.ativa,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Criar Arena a partir de dados do Firestore
   */
  static fromFirestore(data: any): Arena {
    return new Arena({
      id: data.id,
      nome: data.nome,
      slug: data.slug,
      adminEmail: data.adminEmail,
      adminUid: data.adminUid,
      ativa: data.ativa ?? true,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    });
  }
}
