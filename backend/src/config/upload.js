import fs from "fs";
import path from "path";
import multer from "multer";

const configuredUploadDir = process.env.UPLOAD_DIR || "backend/uploads";
const uploadRoot = path.resolve(process.cwd(), configuredUploadDir);

const allowedMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf"
]);

function ensureUploadRoot() {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

function sanitizeBaseName(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").slice(0, 60) || "asset";
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadRoot();
    cb(null, uploadRoot);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeBase = sanitizeBaseName(path.basename(file.originalname, ext));
    cb(null, `${Date.now()}-${safeBase}${ext}`);
  }
});

export const uploadAssetFile = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(new Error("Unsupported file type."));
      return;
    }
    cb(null, true);
  }
});

export function toStoredAssetFile(file) {
  if (!file) return null;

  return {
    originalFileName: file.originalname,
    storedFileName: file.filename,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    filePath: path.relative(process.cwd(), file.path).replace(/\\/g, "/")
  };
}

export function getPublicFileUrl(filePath) {
  if (!filePath) return null;
  return `/uploads/${path.basename(filePath)}`;
}
