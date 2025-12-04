/**
 * Tipos para mock do Firebase nos testes
 *
 * O Timestamp do Firebase tem métodos específicos que precisamos simular.
 * Este arquivo cria tipos compatíveis para uso em fixtures e mocks.
 */

import { Timestamp } from "firebase-admin/firestore";

/**
 * Interface que representa o Timestamp do Firebase
 * Usada para criar mocks tipados
 */
export interface MockTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
  isEqual(other: MockTimestamp): boolean;
}

/**
 * Cria um mock de Timestamp compatível com Firebase
 * @param date - Data base (default: now)
 * @returns Objeto compatível com Timestamp
 *
 * NOTA: Usamos `as unknown as Timestamp` porque o Timestamp real do Firebase
 * tem métodos internos que não precisamos replicar para testes unitários.
 * Isso é aceitável em mocks de teste - diferente de usar `as any` em código de produção.
 */
export function createMockTimestamp(date: Date = new Date()): Timestamp {
  const seconds = Math.floor(date.getTime() / 1000);
  const nanoseconds = (date.getTime() % 1000) * 1000000;

  const mockTimestamp = {
    seconds,
    nanoseconds,
    toDate: () => date,
    toMillis: () => date.getTime(),
    isEqual: (other: MockTimestamp) =>
      other.seconds === seconds && other.nanoseconds === nanoseconds,
    valueOf: () => `Timestamp(seconds=${seconds}, nanoseconds=${nanoseconds})`,
  };

  return mockTimestamp as unknown as Timestamp;
}

/**
 * Cria um Timestamp para uma data específica
 */
export function timestampFromDate(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0
): Timestamp {
  return createMockTimestamp(new Date(year, month - 1, day, hour, minute));
}

/**
 * Cria um Timestamp para "agora"
 */
export function timestampNow(): Timestamp {
  return createMockTimestamp(new Date());
}

/**
 * Cria um Timestamp para daqui a N dias
 */
export function timestampFuture(days: number): Timestamp {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return createMockTimestamp(date);
}

/**
 * Cria um Timestamp para N dias atrás
 */
export function timestampPast(days: number): Timestamp {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return createMockTimestamp(date);
}
