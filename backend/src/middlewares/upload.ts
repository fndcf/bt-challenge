/**
 * Middleware para upload de arquivos
 * Compatível com Cloud Functions Gen 2 (Cloud Run)
 *
 * No Cloud Run, o body pode já vir como buffer raw.
 * Usa busboy para parsear multipart/form-data.
 */

import { Request, Response, NextFunction } from "express";
import Busboy from "busboy";
import { ResponseHelper } from "../utils/responseHelper";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Middleware para upload de arquivo Excel único
 */
export const uploadExcel = (req: Request, res: Response, next: NextFunction) => {
  // Cloud Functions Gen 2: body já está como buffer em req.rawBody ou req.body
  const rawBody = (req as any).rawBody || req.body;

  // Se já temos o rawBody como Buffer, parsear com busboy
  if (Buffer.isBuffer(rawBody)) {
    parseWithBusboy(req, res, next, rawBody);
    return;
  }

  // Caso contrário (desenvolvimento local), coletar o body manualmente
  const chunks: Buffer[] = [];
  req.on("data", (chunk: Buffer) => chunks.push(chunk));
  req.on("end", () => {
    const buffer = Buffer.concat(chunks);
    parseWithBusboy(req, res, next, buffer);
  });
  req.on("error", () => {
    ResponseHelper.badRequest(res, "Erro ao receber arquivo");
  });
};

function parseWithBusboy(
  req: Request,
  res: Response,
  next: NextFunction,
  rawBody: Buffer
) {
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

      // Anexar file ao request (compatível com a interface do Multer)
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

    busboy.end(rawBody);
  } catch (error) {
    ResponseHelper.badRequest(res, "Erro ao processar upload");
  }
}
