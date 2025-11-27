// backend/src/services/ArenaService.ts

import {
  arenaRepository,
  IArenaRepository,
} from "../repositories/ArenaRepository";
import { Arena, ArenaType } from "../domain/Arena";
import { auth, db } from "../config/firebase";
import { COLLECTIONS } from "../config/firestore";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/errors";
import { generateUniqueSlug } from "../utils/slugify";
import logger from "../utils/logger";

/**
 * Dados para criar uma arena
 */
export interface CreateArenaDTO {
  nome: string;
  slug?: string;
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
      // Gerar slug automaticamente se não for fornecido
      let slug = data.slug;

      if (!slug) {
        logger.info("Gerando slug automaticamente", { nome: data.nome });
        slug = await generateUniqueSlug(data.nome, (s) =>
          this.arenaRepository.exists(s)
        );
        logger.info("Slug gerado", { slug, nome: data.nome });
      } else {
        // Se slug foi fornecido manualmente, validar
        this.validateSlug(slug);

        const slugExists = await this.arenaRepository.exists(slug);
        if (slugExists) {
          throw new ConflictError(`O slug "${slug}" já está em uso`);
        }
      }

      // Validar outros dados
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
          id: "",
          nome: data.nome,
          slug: slug,
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
          logger.warn("Falha ao gerar link de verificação", {
            email: data.adminEmail,
          });
        }

        logger.info("Arena criada com sucesso", {
          arenaId: arena.id,
          nome: arena.nome,
          slug: arena.slug,
          adminEmail: data.adminEmail,
          adminUid: userRecord.uid,
        });

        return {
          arena,
          adminUid: userRecord.uid,
          message: `Arena "${
            arena.nome
          }" criada com sucesso! Acesse: ${arena.getPublicUrl()}`,
        };
      } catch (error) {
        // Rollback: deletar usuário do Auth
        logger.error(
          "Erro ao criar arena, fazendo rollback",
          {
            adminEmail: data.adminEmail,
            adminUid: userRecord.uid,
          },
          error as Error
        );

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

    const updatedArena = await this.arenaRepository.update(id, updateData);

    logger.info("Arena atualizada", {
      arenaId: id,
      adminUid,
      camposAtualizados: Object.keys(updateData),
    });

    return updatedArena;
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

    logger.info("Arena desativada", {
      arenaId: id,
      nome: arena.nome,
      adminUid,
    });
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
      "public",
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
