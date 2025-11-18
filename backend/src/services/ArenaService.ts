// backend/src/services/ArenaService.ts

import {
  arenaRepository,
  IArenaRepository,
} from "../repositories/ArenaRepository";
import { Arena, ArenaType } from "../domain/Arena";
import { auth, db } from "../config/firebase";
import { COLLECTIONS } from "../config/firestore";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/errors";
import { generateUniqueSlug } from "../utils/slugify"; // ✅ IMPORTAR

/**
 * Dados para criar uma arena
 */
export interface CreateArenaDTO {
  nome: string;
  slug?: string; // ✅ AGORA É OPCIONAL
  adminEmail: string;
  adminPassword: string;
}

/**
 * Serviço de Arena
 * Contém a lógica de negócio para gerenciar arenas
 */
export class ArenaService {
  constructor(private arenaRepository: IArenaRepository) {}

  /**
   * Criar nova arena com admin
   */
  async createArena(data: CreateArenaDTO): Promise<{
    arena: Arena;
    adminUid: string;
    message: string;
  }> {
    try {
      // ✅ GERAR SLUG AUTOMATICAMENTE SE NÃO FOR FORNECIDO
      let slug = data.slug;

      if (!slug) {
        console.log(`🔄 Gerando slug automaticamente para: "${data.nome}"`);
        slug = await generateUniqueSlug(data.nome, (s) =>
          this.arenaRepository.exists(s)
        );
        console.log(`✅ Slug gerado: "${slug}"`);
      } else {
        // Se slug foi fornecido manualmente, validar
        console.log(`🔍 Validando slug fornecido: "${slug}"`);
        this.validateSlug(slug);

        const slugExists = await this.arenaRepository.exists(slug);
        if (slugExists) {
          throw new ConflictError(`O slug "${slug}" já está em uso`);
        }
      }

      // Validar outros dados (agora slug é garantido)
      this.validateArenaData({ ...data, slug });

      // 1. Criar usuário no Firebase Authentication
      const userRecord = await auth.createUser({
        email: data.adminEmail,
        password: data.adminPassword,
        emailVerified: false,
      });

      try {
        // 2. Criar arena no Firestore
        const arenaData: ArenaType = {
          id: "", // Será preenchido pelo repositório
          nome: data.nome,
          slug: slug, // ✅ Usar slug gerado ou fornecido
          adminEmail: data.adminEmail,
          adminUid: userRecord.uid,
          ativa: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const arena = await this.arenaRepository.create(arenaData);

        // 3. Criar documento de admin no Firestore
        await db.collection(COLLECTIONS.ADMINS).doc(userRecord.uid).set({
          uid: userRecord.uid,
          email: data.adminEmail,
          arenaId: arena.id,
          role: "admin",
          createdAt: new Date(),
        });

        // 4. Enviar email de verificação (opcional)
        try {
          await auth.generateEmailVerificationLink(data.adminEmail);
        } catch (error) {
          console.warn("Erro ao gerar link de verificação:", error);
          // Não falha se não conseguir enviar email
        }

        return {
          arena,
          adminUid: userRecord.uid,
          message: `Arena "${
            arena.nome
          }" criada com sucesso! Acesse: ${arena.getPublicUrl()}`,
        };
      } catch (error) {
        // Se falhar ao criar arena, deletar usuário do Auth
        await auth.deleteUser(userRecord.uid);
        throw error;
      }
    } catch (error: any) {
      if (error.code === "auth/email-already-exists") {
        throw new ConflictError("Este email já está cadastrado");
      }
      throw error;
    }
  }

  /**
   * Buscar arena por ID
   */
  async getArenaById(id: string): Promise<Arena> {
    const arena = await this.arenaRepository.findById(id);

    if (!arena) {
      throw new NotFoundError("Arena não encontrada");
    }

    return arena;
  }

  /**
   * Buscar arena por slug
   */
  async getArenaBySlug(slug: string): Promise<Arena> {
    const arena = await this.arenaRepository.findBySlug(slug);

    if (!arena) {
      throw new NotFoundError("Arena não encontrada");
    }

    return arena;
  }

  /**
   * Buscar arena do admin autenticado
   */
  async getAdminArena(adminUid: string): Promise<Arena> {
    const arena = await this.arenaRepository.findByAdminUid(adminUid);

    if (!arena) {
      throw new NotFoundError(
        "Nenhuma arena encontrada para este administrador"
      );
    }

    return arena;
  }

  /**
   * Listar todas as arenas
   */
  async listArenas(): Promise<Arena[]> {
    return await this.arenaRepository.list();
  }

  /**
   * Atualizar arena
   */
  async updateArena(
    id: string,
    adminUid: string,
    data: Partial<ArenaType>
  ): Promise<Arena> {
    // Verificar se arena existe e pertence ao admin
    const arena = await this.getArenaById(id);

    if (arena.adminUid !== adminUid) {
      throw new BadRequestError(
        "Você não tem permissão para atualizar esta arena"
      );
    }

    // Validar slug se estiver sendo atualizado
    if (data.slug) {
      this.validateSlug(data.slug);
    }

    // Não permitir atualizar alguns campos
    const {
      id: _,
      adminUid: __,
      adminEmail: ___,
      createdAt: ____,
      ...updateData
    } = data as any;

    return await this.arenaRepository.update(id, updateData);
  }

  /**
   * Desativar arena
   */
  async deactivateArena(id: string, adminUid: string): Promise<void> {
    // Verificar se arena existe e pertence ao admin
    const arena = await this.getArenaById(id);

    if (arena.adminUid !== adminUid) {
      throw new BadRequestError(
        "Você não tem permissão para desativar esta arena"
      );
    }

    await this.arenaRepository.delete(id);
  }

  /**
   * Verificar se slug está disponível
   */
  async isSlugAvailable(slug: string): Promise<boolean> {
    this.validateSlug(slug);
    return !(await this.arenaRepository.exists(slug));
  }

  /**
   * Validar dados da arena
   */
  private validateArenaData(data: CreateArenaDTO): void {
    if (!data.nome || data.nome.trim().length < 3) {
      throw new BadRequestError(
        "Nome da arena deve ter no mínimo 3 caracteres"
      );
    }

    // ✅ Slug agora é opcional, só valida se fornecido
    if (data.slug) {
      this.validateSlug(data.slug);
    }

    if (!data.adminEmail || !this.isValidEmail(data.adminEmail)) {
      throw new BadRequestError("Email do administrador inválido");
    }

    if (!data.adminPassword || data.adminPassword.length < 6) {
      throw new BadRequestError("Senha deve ter no mínimo 6 caracteres");
    }
  }

  /**
   * Validar slug
   */
  private validateSlug(slug: string): void {
    if (!slug || slug.trim().length < 3) {
      throw new BadRequestError("Slug deve ter no mínimo 3 caracteres");
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      throw new BadRequestError(
        "Slug deve conter apenas letras minúsculas, números e hífens"
      );
    }

    // Slugs reservados
    const reservedSlugs = [
      "admin",
      "api",
      "login",
      "register",
      "logout",
      "home",
      "about",
      "contact",
      "privacy",
      "terms",
      "public", // ✅ ADICIONAR esse também
    ];

    if (reservedSlugs.includes(slug)) {
      throw new BadRequestError(
        `O slug "${slug}" é reservado e não pode ser usado`
      );
    }
  }

  /**
   * Validar email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Exportar instância única
export const arenaService = new ArenaService(arenaRepository);
