/**
 * Middleware para upload de arquivos
 * Compatível com Cloud Functions Gen 2 (Cloud Run) e desenvolvimento local
 *
 * Cloud Functions consome o body antes do Express.
 * Usa busboy para parsear multipart/form-data a partir do rawBody.
 */

import { Request, Response, NextFunction } from "express";
import Busboy from "busboy";
import { ResponseHelper } from "../utils/responseHelper";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Middleware para upload de arquivo Excel único
 */
export const uploadExcel = (req: Request, res: Response, next: NextFunction) => {
  try {
    const busboy = Busboy({
    headers: req.headers,
    limits: { fileSize: MAX_FILE_SIZE },
  });

  let fileBuffer: Buffer | null = null;
  let fileName = "";
  let fileMimeType = "";
  let fileTruncated = false;

  busboy.on("file", (_fieldname, stream, info) => {
    fileName = info.filename;
    fileMimeType = info.mimeType;
    const chunks: Buffer[] = [];

    stream.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    stream.on("limit", () => {
      fileTruncated = true;
    });

    stream.on("end", () => {
      fileBuffer = Buffer.concat(chunks);
    });
  });

  busboy.on("finish", () => {
    if (fileTruncated) {
      ResponseHelper.badRequest(res, "Arquivo muito grande. Tamanho máximo: 5MB");
      return;
    }

    if (!fileBuffer) {
      ResponseHelper.badRequest(res, "Nenhum arquivo enviado");
      return;
    }

    const allowedMimes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "application/octet-stream",
    ];

    if (!allowedMimes.includes(fileMimeType) && !fileName.endsWith(".xlsx")) {
      ResponseHelper.badRequest(
        res,
        "Formato de arquivo inválido. Envie um arquivo Excel (.xlsx)"
      );
      return;
    }

    (req as any).file = {
      buffer: fileBuffer,
      originalname: fileName,
      mimetype: fileMimeType,
      size: fileBuffer.length,
    };

    next();
  });

  busboy.on("error", () => {
    ResponseHelper.badRequest(res, "Erro ao processar arquivo");
  });

  // Cloud Functions Gen 2: body já foi consumido e está em req.rawBody
  const rawBody = (req as any).rawBody;
  if (rawBody) {
    busboy.end(rawBody);
  } else {
    // Desenvolvimento local: pipar o request stream para o busboy
    req.pipe(busboy);
  }
  } catch (error) {
    ResponseHelper.badRequest(res, "Erro ao processar upload. Verifique o formato do arquivo.");
  }
};
