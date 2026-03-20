/**
 * Testes do middleware de upload
 */

import { Request, Response, NextFunction } from "express";

// Mock do multer antes do import
const mockSingle = jest.fn();

class MockMulterError extends Error {
  code: string;
  constructor(code: string) {
    super(`MulterError: ${code}`);
    this.code = code;
    this.name = "MulterError";
  }
}

jest.mock("multer", () => {
  const multer = () => ({
    single: () => mockSingle,
  });
  multer.memoryStorage = jest.fn(() => ({}));
  multer.MulterError = MockMulterError;
  return multer;
});

import { uploadExcel } from "../../middlewares/upload";

describe("uploadExcel middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it("deve chamar next() quando upload é bem-sucedido", () => {
    mockSingle.mockImplementation((_req: Request, _res: Response, cb: (err?: Error) => void) => {
      cb();
    });

    uploadExcel(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it("deve retornar 400 quando arquivo é muito grande", () => {
    mockSingle.mockImplementation((_req: Request, _res: Response, cb: (err?: Error) => void) => {
      cb(new MockMulterError("LIMIT_FILE_SIZE"));
    });

    uploadExcel(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("deve retornar 400 quando ocorre erro customizado", () => {
    mockSingle.mockImplementation((_req: Request, _res: Response, cb: (err?: Error) => void) => {
      cb(new Error("Formato de arquivo inválido"));
    });

    uploadExcel(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
