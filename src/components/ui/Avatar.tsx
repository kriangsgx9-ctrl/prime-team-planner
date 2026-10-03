import { avatarColorFor, initialsFor } from "@/lib/avatar";

export function Avatar({ name, photo, size = 36 }: { name: string; photo?: string | null; size?: number }) {
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt="" width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4), background: avatarColorFor(name) }}
    >
      {initialsFor(name)}
    </span>
  );
}
