/**
 * Testes para firebase-mock.ts
 * Utilitários para criação de mocks de Timestamp do Firebase
 */

import {
  createMockTimestamp,
  timestampFromDate,
  timestampNow,
  timestampFuture,
  timestampPast,
  MockTimestamp,
} from "../types/firebase-mock";

describe("firebase-mock", () => {
  describe("createMockTimestamp", () => {
    it("deve criar um mock timestamp com data padrão (agora)", () => {
      const before = Date.now();
      const timestamp = createMockTimestamp();
      const after = Date.now();

      const timestampMillis = timestamp.toMillis();
      expect(timestampMillis).toBeGreaterThanOrEqual(before);
      expect(timestampMillis).toBeLessThanOrEqual(after);
    });

    it("deve criar um mock timestamp com data específica", () => {
      const date = new Date(2024, 5, 15, 10, 30, 0); // 15 Jun 2024 10:30
      const timestamp = createMockTimestamp(date);

      expect(timestamp.toDate()).toEqual(date);
      expect(timestamp.toMillis()).toBe(date.getTime());
    });

    it("deve ter seconds e nanoseconds corretos", () => {
      const date = new Date(2024, 0, 1, 0, 0, 0, 500); // 1 Jan 2024 com 500ms
      const timestamp = createMockTimestamp(date);

      const expectedSeconds = Math.floor(date.getTime() / 1000);
      const expectedNanoseconds = (date.getTime() % 1000) * 1000000;

      expect(timestamp.seconds).toBe(expectedSeconds);
      expect(timestamp.nanoseconds).toBe(expectedNanoseconds);
    });

    it("deve implementar isEqual corretamente", () => {
      const date = new Date(2024, 5, 15, 10, 30, 0);
      const timestamp1 = createMockTimestamp(date) as unknown as MockTimestamp;
      const timestamp2 = createMockTimestamp(date) as unknown as MockTimestamp;
      const timestamp3 = createMockTimestamp(
        new Date(2024, 5, 16)
      ) as unknown as MockTimestamp;

      expect(timestamp1.isEqual(timestamp2)).toBe(true);
      expect(timestamp1.isEqual(timestamp3)).toBe(false);
    });

    it("deve implementar valueOf corretamente", () => {
      const date = new Date(2024, 0, 1, 0, 0, 0);
      const timestamp = createMockTimestamp(date) as unknown as {
        valueOf: () => string;
      };

      const seconds = Math.floor(date.getTime() / 1000);
      expect(timestamp.valueOf()).toBe(
        `Timestamp(seconds=${seconds}, nanoseconds=0)`
      );
    });

    it("deve retornar a data correta com toDate()", () => {
      const originalDate = new Date(2024, 3, 20, 15, 45, 30);
      const timestamp = createMockTimestamp(originalDate);

      const returnedDate = timestamp.toDate();
      expect(returnedDate).toEqual(originalDate);
      expect(returnedDate.getTime()).toBe(originalDate.getTime());
    });
  });

  describe("timestampFromDate", () => {
    it("deve criar timestamp para data com hora padrão (00:00)", () => {
      const timestamp = timestampFromDate(2024, 6, 15);

      const date = timestamp.toDate();
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(5); // Junho (0-indexed)
      expect(date.getDate()).toBe(15);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
    });

    it("deve criar timestamp para data com hora específica", () => {
      const timestamp = timestampFromDate(2024, 12, 25, 18, 30);

      const date = timestamp.toDate();
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(11); // Dezembro (0-indexed)
      expect(date.getDate()).toBe(25);
      expect(date.getHours()).toBe(18);
      expect(date.getMinutes()).toBe(30);
    });

    it("deve lidar com primeiro dia do mês", () => {
      const timestamp = timestampFromDate(2024, 1, 1);

      const date = timestamp.toDate();
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(1);
    });

    it("deve lidar com último dia do ano", () => {
      const timestamp = timestampFromDate(2024, 12, 31, 23, 59);

      const date = timestamp.toDate();
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(11);
      expect(date.getDate()).toBe(31);
      expect(date.getHours()).toBe(23);
      expect(date.getMinutes()).toBe(59);
    });
  });

  describe("timestampNow", () => {
    it("deve criar timestamp para momento atual", () => {
      const before = Date.now();
      const timestamp = timestampNow();
      const after = Date.now();

      expect(timestamp.toMillis()).toBeGreaterThanOrEqual(before);
      expect(timestamp.toMillis()).toBeLessThanOrEqual(after);
    });

    it("deve criar timestamps diferentes em chamadas consecutivas (com delay)", async () => {
      const timestamp1 = timestampNow();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const timestamp2 = timestampNow();

      expect(timestamp2.toMillis()).toBeGreaterThan(timestamp1.toMillis());
    });
  });

  describe("timestampFuture", () => {
    it("deve criar timestamp para 1 dia no futuro", () => {
      const now = new Date();
      const timestamp = timestampFuture(1);
      const timestampDate = timestamp.toDate();

      const expectedDate = new Date(now);
      expectedDate.setDate(expectedDate.getDate() + 1);

      expect(timestampDate.getDate()).toBe(expectedDate.getDate());
    });

    it("deve criar timestamp para 7 dias no futuro", () => {
      const now = new Date();
      const timestamp = timestampFuture(7);
      const timestampDate = timestamp.toDate();

      const diffMs = timestampDate.getTime() - now.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(7);
    });

    it("deve criar timestamp para 30 dias no futuro", () => {
      const now = new Date();
      const timestamp = timestampFuture(30);
      const timestampDate = timestamp.toDate();

      const diffMs = timestampDate.getTime() - now.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(30);
    });

    it("deve criar timestamp no futuro para 0 dias (hoje)", () => {
      const now = new Date();
      const timestamp = timestampFuture(0);
      const timestampDate = timestamp.toDate();

      // Deve ser aproximadamente agora
      const diffMs = Math.abs(timestampDate.getTime() - now.getTime());
      expect(diffMs).toBeLessThan(1000); // Menos de 1 segundo de diferença
    });
  });

  describe("timestampPast", () => {
    it("deve criar timestamp para 1 dia no passado", () => {
      const now = new Date();
      const timestamp = timestampPast(1);
      const timestampDate = timestamp.toDate();

      const expectedDate = new Date(now);
      expectedDate.setDate(expectedDate.getDate() - 1);

      expect(timestampDate.getDate()).toBe(expectedDate.getDate());
    });

    it("deve criar timestamp para 7 dias no passado", () => {
      const now = new Date();
      const timestamp = timestampPast(7);
      const timestampDate = timestamp.toDate();

      const diffMs = now.getTime() - timestampDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(7);
    });

    it("deve criar timestamp para 365 dias no passado (1 ano)", () => {
      const now = new Date();
      const timestamp = timestampPast(365);
      const timestampDate = timestamp.toDate();

      const diffMs = now.getTime() - timestampDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(365);
    });

    it("deve criar timestamp no passado para 0 dias (hoje)", () => {
      const now = new Date();
      const timestamp = timestampPast(0);
      const timestampDate = timestamp.toDate();

      // Deve ser aproximadamente agora
      const diffMs = Math.abs(timestampDate.getTime() - now.getTime());
      expect(diffMs).toBeLessThan(1000); // Menos de 1 segundo de diferença
    });
  });

  describe("Integração entre funções", () => {
    it("timestampFuture(N) e timestampPast(N) devem ter diferença de 2N dias", () => {
      const days = 5;
      const future = timestampFuture(days);
      const past = timestampPast(days);

      const diffMs = future.toMillis() - past.toMillis();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(days * 2);
    });

    it("timestamps criados devem ser comparáveis via isEqual", () => {
      const date = new Date(2024, 6, 15, 12, 0, 0);
      const ts1 = createMockTimestamp(date) as unknown as MockTimestamp;
      const ts2 = createMockTimestamp(date) as unknown as MockTimestamp;

      expect(ts1.isEqual(ts2)).toBe(true);
    });
  });
});
