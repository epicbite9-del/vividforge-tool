export const MAX_FILE_SIZE_MB = 10;
export const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

export const validateFile = (file) => {
  if (!file) return "No file selected.";
  if (!SUPPORTED_FORMATS.includes(file.type)) return "Unsupported format. Use JPG, PNG, or WebP.";
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `File too large. Limit is ${MAX_FILE_SIZE_MB}MB.`;
  return null;
};
