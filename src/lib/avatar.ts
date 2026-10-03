const AVATAR_PALETTE = ["#0A2A5E", "#1B4A8F", "#FF6A00", "#2FA86B", "#8B5CF6", "#D9480F", "#0E7490", "#B5651D"];

export function avatarColorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

export function initialsFor(name: string): string {
  const cleaned = name.replace(/^(คุณ|นาย|นาง|นางสาว)\s*/, "").trim();
  return cleaned.slice(0, 1).toUpperCase() || "?";
}

/** Reads an <input type=file> image, center-crops it to a square and resizes
 * it down to maxSize so a photo costs only a few KB — same approach as the
 * offline HTML app's resizeImageFile(). */
export function resizeImageFile(file: File, maxSize = 160, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, maxSize, maxSize);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("อ่านไฟล์รูปไม่สำเร็จ"));
      img.src = e.target!.result as string;
    };
    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}
