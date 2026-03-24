import fs from "fs";
import path from "path";
import multer from "multer";

const configuredUploadDir = process.env.UPLOAD_DIR || "backend/uploads";
const uploadRoot = path.resolve(process.cwd(), configuredUploadDir);

function ensureUploadRoot() {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

function sanitizeBaseName(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").slice(0, 60) || "asset";
}

/** Normalize filename for display/storage: fix Unicode spaces and strip problematic chars. */
function sanitizeDisplayFilename(name) {
  if (!name || typeof name !== "string") return name || "";
  return name
    // Handle known mojibake sequence for narrow no-break space
    .replace(/â¯/g, " ")
    .replace(/\u202F/g, " ")   // narrow no-break space
    .replace(/\u00A0/g, " ")   // non-breaking space
    .replace(/\u2007/g, " ")   // figure space
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 255) || "file";
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
  }
});

export function toStoredAssetFile(file) {
  if (!file) return null;

  return {
    originalFileName: sanitizeDisplayFilename(file.originalname),
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
