/**
 * Testes do middleware de upload
 */

import { Request, Response, NextFunction } from "express";
import { EventEmitter } from "events";

// Mock do busboy
const mockBusboyInstance = new EventEmitter();
(mockBusboyInstance as any).end = jest.fn();

jest.mock("busboy", () => {
  return jest.fn(() => mockBusboyInstance);
});

jest.mock("../../utils/responseHelper", () => ({
  ResponseHelper: {
    badRequest: jest.fn((res: Response, msg: string) => {
      res.status(400).json({ error: msg });
    }),
  },
}));

import { uploadExcel } from "../../middlewares/upload";
import { ResponseHelper } from "../../utils/responseHelper";

describe("uploadExcel middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBusboyInstance.removeAllListeners();

    mockReq = {
      headers: { "content-type": "multipart/form-data; boundary=---" },
      body: Buffer.from("fake"),
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it("deve rejeitar quando Content-Type não é multipart", () => {
    mockReq.headers = { "content-type": "application/json" };

    uploadExcel(mockReq as Request, mockRes as Response, mockNext);

    expect(ResponseHelper.badRequest).toHaveBeenCalledWith(
      mockRes,
      "Content-Type deve ser multipart/form-data"
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("deve chamar next() quando arquivo válido é recebido", () => {
    uploadExcel(mockReq as Request, mockRes as Response, mockNext);

    // Simular arquivo recebido via busboy
    const fileStream = new EventEmitter();
    mockBusboyInstance.emit("file", "file", fileStream, {
      filename: "jogadores.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    fileStream.emit("data", Buffer.from("fake-xlsx-data"));
    fileStream.emit("end");

    mockBusboyInstance.emit("finish");

    expect(mockNext).toHaveBeenCalled();
    expect((mockReq as any).file).toBeDefined();
    expect((mockReq as any).file.originalname).toBe("jogadores.xlsx");
  });

  it("deve rejeitar quando nenhum arquivo é enviado", () => {
    uploadExcel(mockReq as Request, mockRes as Response, mockNext);

    mockBusboyInstance.emit("finish");

    expect(ResponseHelper.badRequest).toHaveBeenCalledWith(
      mockRes,
      "Nenhum arquivo enviado"
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("deve rejeitar quando arquivo excede tamanho máximo", () => {
    uploadExcel(mockReq as Request, mockRes as Response, mockNext);

    const fileStream = new EventEmitter();
    mockBusboyInstance.emit("file", "file", fileStream, {
      filename: "jogadores.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    fileStream.emit("data", Buffer.from("data"));
    fileStream.emit("limit");
    fileStream.emit("end");

    mockBusboyInstance.emit("finish");

    expect(ResponseHelper.badRequest).toHaveBeenCalledWith(
      mockRes,
      "Arquivo muito grande. Tamanho máximo: 5MB"
    );
  });
});
