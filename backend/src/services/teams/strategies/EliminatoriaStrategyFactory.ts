/**
 * Factory para criar estratégias de eliminatória
 * Implementa o padrão Factory para instanciar a estratégia correta baseado no número de grupos
 */

import { IEliminatoriaStrategy } from "./IEliminatoriaStrategy";
import { Eliminatoria2GruposStrategy } from "./Eliminatoria2GruposStrategy";
import { Eliminatoria3GruposStrategy } from "./Eliminatoria3GruposStrategy";
import { Eliminatoria4GruposStrategy } from "./Eliminatoria4GruposStrategy";
import { Eliminatoria5GruposStrategy } from "./Eliminatoria5GruposStrategy";
import { Eliminatoria6GruposStrategy } from "./Eliminatoria6GruposStrategy";
import { Eliminatoria7GruposStrategy } from "./Eliminatoria7GruposStrategy";
import { Eliminatoria8GruposStrategy } from "./Eliminatoria8GruposStrategy";

/**
 * Factory que retorna a estratégia correta baseada no número de grupos
 * Extensível: para adicionar novos formatos, basta criar nova Strategy e registrar aqui
 */
export class EliminatoriaStrategyFactory {
  private strategies: Map<number, IEliminatoriaStrategy>;

  constructor() {
    this.strategies = new Map();
    this.registerStrategies();
  }

  /**
   * Registra todas as estratégias disponíveis
   */
  private registerStrategies(): void {
    this.strategies.set(2, new Eliminatoria2GruposStrategy());
    this.strategies.set(3, new Eliminatoria3GruposStrategy());
    this.strategies.set(4, new Eliminatoria4GruposStrategy());
    this.strategies.set(5, new Eliminatoria5GruposStrategy());
    this.strategies.set(6, new Eliminatoria6GruposStrategy());
    this.strategies.set(7, new Eliminatoria7GruposStrategy());
    this.strategies.set(8, new Eliminatoria8GruposStrategy());
  }

  /**
   * Obtém a estratégia para o número de grupos especificado
   * @param numGrupos Número de grupos (2-8)
   * @returns A estratégia correspondente ou null se não suportado
   */
  getStrategy(numGrupos: number): IEliminatoriaStrategy | null {
    return this.strategies.get(numGrupos) ?? null;
  }

  /**
   * Verifica se o número de grupos é suportado
   * @param numGrupos Número de grupos
   * @returns true se suportado, false caso contrário
   */
  isSupported(numGrupos: number): boolean {
    return this.strategies.has(numGrupos);
  }

  /**
   * Retorna os números de grupos suportados
   */
  getSupportedGroupCounts(): number[] {
    return Array.from(this.strategies.keys()).sort((a, b) => a - b);
  }

  /**
   * Registra uma nova estratégia (útil para extensões e testes)
   * @param numGrupos Número de grupos
   * @param strategy Estratégia a registrar
   */
  registerStrategy(numGrupos: number, strategy: IEliminatoriaStrategy): void {
    this.strategies.set(numGrupos, strategy);
  }
}

// Singleton para uso global
export const eliminatoriaStrategyFactory = new EliminatoriaStrategyFactory();
