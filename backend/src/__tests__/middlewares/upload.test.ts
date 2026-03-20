/**
 * Testes do middleware de upload (busboy)
 */

import { Request, Response, NextFunction } from "express";
import { EventEmitter } from "events";

// Mock busboy instance
let mockBusboyInstance: EventEmitter & { end: jest.Mock };

jest.mock("busboy", () => {
  return jest.fn(() => {
    mockBusboyInstance = Object.assign(new EventEmitter(), {
      end: jest.fn(),
    });
    return mockBusboyInstance;
  });
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
  let mockReq: Partial<Request> & { rawBody?: Buffer; pipe?: jest.Mock };
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      headers: { "content-type": "multipart/form-data; boundary=---" },
      rawBody: Buffer.from("fake-multipart-body"),
      pipe: jest.fn(),
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it("deve chamar next() quando arquivo válido é recebido", () => {
    uploadExcel(mockReq as Request, mockRes as Response, mockNext);

    const fileStream = new EventEmitter();
    mockBusboyInstance.emit("file", "file", fileStream, {
      filename: "jogadores.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    fileStream.emit("data", Buffer.from("fake-xlsx"));
    fileStream.emit("end");
    mockBusboyInstance.emit("finish");

    expect(mockNext).toHaveBeenCalled();
    expect((mockReq as any).file).toBeDefined();
    expect((mockReq as any).file.originalname).toBe("jogadores.xlsx");
  });

  it("deve usar rawBody quando disponível (Cloud Functions)", () => {
    uploadExcel(mockReq as Request, mockRes as Response, mockNext);

    expect(mockBusboyInstance.end).toHaveBeenCalledWith(mockReq.rawBody);
    expect(mockReq.pipe).not.toHaveBeenCalled();
  });

  it("deve usar pipe quando rawBody não está disponível (local)", () => {
    delete mockReq.rawBody;

    uploadExcel(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.pipe).toHaveBeenCalledWith(mockBusboyInstance);
  });

  it("deve rejeitar quando nenhum arquivo é enviado", () => {
    uploadExcel(mockReq as Request, mockRes as Response, mockNext);

    mockBusboyInstance.emit("finish");

    expect(ResponseHelper.badRequest).toHaveBeenCalledWith(
      mockRes,
      "Nenhum arquivo enviado"
    );
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
