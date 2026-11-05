import { APP_NAME } from "@/lib/config";

export function Mark({ text, src, size = 36 }: { text: string; src?: string; size?: number }) {
  const initials = text.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "FS";
  return (
    <span
      className="grid place-items-center rounded-lg bg-[var(--accent)] text-[var(--accent-ink)] font-[family-name:var(--font-display)] font-bold shrink-0 overflow-hidden"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- logo is any https URL the business provides */}
      {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : initials}
    </span>
  );
}

export function ProductMark() {
  return (
    <span className="flex items-center gap-2">
      <Mark text={APP_NAME} />
      <b className="font-[family-name:var(--font-display)] text-lg">{APP_NAME}</b>
    </span>
  );
}
