import Link from "next/link";
import { ProductMark } from "@/components/Logo";
import { APP_NAME, TRIAL_DAYS } from "@/lib/config";

const FLOW = ["Request", "Quote", "Job", "Schedule", "Work", "Invoice", "Paid", "Review"];

const FEATURES = [
  ["Quotes that close", "Price from your own price list, offer good/better/best and add-ons, and turn an approved quote into a job in one tap."],
  ["A schedule your techs follow", "Arrival windows, assigned techs, and an on-my-way text when they head out."],
  ["Trade tools built in", "Model and serial records for appliance repair. Unit age, tonnage and refrigerant for HVAC. Checklists for every job."],
  ["Invoices with your brand", "Your logo, license number and terms. Invoice straight from the finished job and send the review request with it."],
  ["A portal for your customers", "Customers request work, approve quotes, see their tech and pay online in one place."],
];

export default function Home() {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="gutter py-4 flex items-center justify-between gap-3 max-w-6xl w-full mx-auto">
        <ProductMark />
        <nav className="flex items-center gap-2">
          <Link href="/login" className="btn btn-sm">Log in</Link>
          <Link href="/signup" className="btn btn-sm btn-primary">Start free trial</Link>
        </nav>
      </header>

      <main className="gutter flex-1 max-w-6xl w-full mx-auto flex flex-col gap-14 py-10">
        <section className="flex flex-col gap-5 max-w-3xl">
          <p className="label">Field service software</p>
          <h1 className="text-4xl sm:text-6xl">From the first call to the five-star review.</h1>
          <p className="text-lg text-[var(--muted)] max-w-2xl">
            {APP_NAME} runs the whole job for appliance repair, HVAC, plumbing and handyman businesses: quotes, scheduling, the tech&apos;s day, invoices, payments and a client portal.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="btn btn-primary">Start your {TRIAL_DAYS}-day free trial</Link>
            <Link href="/login" className="btn">Log in</Link>
          </div>
          <p className="text-sm text-[var(--muted)]">No card needed to start.</p>
        </section>

        <section aria-label="How a job moves" className="overflow-x-auto">
          <ol className="flex gap-2 min-w-max">
            {FLOW.map((step, i) => (
              <li key={step} className="flex items-center gap-2">
                <span className="mono text-xs text-[var(--muted)]">{String(i + 1).padStart(2, "0")}</span>
                <span className="card !py-2 !px-3 !rounded-full font-semibold">{step}</span>
                {i < FLOW.length - 1 && <span aria-hidden className="text-[var(--muted)]">→</span>}
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([t, d]) => (
            <article key={t} className="card">
              <h2 className="text-xl">{t}</h2>
              <p className="text-[var(--muted)]">{d}</p>
            </article>
          ))}
        </section>
      </main>

      <footer className="gutter py-6 text-sm text-[var(--muted)] max-w-6xl w-full mx-auto">© {new Date().getFullYear()} {APP_NAME}</footer>
    </div>
  );
}
