/**
 * Middleware para upload de arquivos usando Multer
 */

import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { ResponseHelper } from "../utils/responseHelper";

const storage = multer.memoryStorage();

const excelFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Formato de arquivo inválido. Envie um arquivo Excel (.xlsx)"));
  }
};

const upload = multer({
  storage,
  fileFilter: excelFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

/**
 * Middleware para upload de arquivo Excel único
 */
export const uploadExcel = (req: Request, res: Response, next: NextFunction) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        ResponseHelper.badRequest(res, "Arquivo muito grande. Tamanho máximo: 5MB");
        return;
      }
      ResponseHelper.badRequest(res, `Erro no upload: ${err.message}`);
      return;
    }

    if (err) {
      ResponseHelper.badRequest(res, err.message);
      return;
    }

    next();
  });
};
