import { logoutAction } from "@/app/actions/auth";
import { ProductMark } from "@/components/Logo";

export default function NoCompany() {
  return (
    <main className="gutter max-w-xl mx-auto py-10 flex flex-col gap-5">
      <ProductMark />
      <div className="card">
        <h1 className="text-2xl">You&apos;re not on a team right now</h1>
        <p className="text-[var(--muted)]">Your account isn&apos;t part of any business, possibly because you were removed. Ask a manager for a new invite link.</p>
        <form action={logoutAction}><button className="btn">Log out</button></form>
      </div>
    </main>
  );
}
