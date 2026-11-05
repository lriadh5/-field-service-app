import Link from "next/link";
import { ProductMark } from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="gutter py-4 max-w-xl w-full mx-auto"><Link href="/" aria-label="Home"><ProductMark /></Link></header>
      <main className="gutter flex-1 max-w-xl w-full mx-auto pb-16">{children}</main>
    </div>
  );
}
