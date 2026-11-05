import { updateCompanyAction } from "@/app/actions/company";
import { ActionForm } from "@/components/ActionForm";
import { Field, TextArea } from "@/components/Field";
import { TradePicker } from "@/components/TradePicker";
import { requireMember } from "@/lib/session";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const me = await requireMember("admin");
  const c = me.company;
  return (
    <>
      <div>
        <h1 className="text-3xl">Business settings</h1>
        <p className="text-[var(--muted)]">Shown on your quotes, invoices and client portal.</p>
      </div>
      <div className="card">
        <ActionForm action={updateCompanyAction} submitLabel="Save settings">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Business name" name="name" defaultValue={c.name} required />
            <Field label="Phone" name="phone" type="tel" defaultValue={c.phone} />
            <Field label="Email" name="email" type="email" defaultValue={c.email} />
            <Field label="License number" name="license" defaultValue={c.license} />
          </div>
          <Field label="Address" name="address" defaultValue={c.address} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Logo link" name="logoUrl" type="url" defaultValue={c.logoUrl} placeholder="https://…" hint="Logo upload is coming. For now, paste a link to your logo image." />
            <Field label="Google review link" name="reviewLink" type="url" defaultValue={c.reviewLink} placeholder="https://g.page/r/…" hint="Sent to customers after a finished job." />
            <Field label="Sales tax %" name="taxRate" type="number" step="0.01" min="0" max="30" defaultValue={(c.taxRateBps / 100).toString()} />
            <Field label="How customers can pay" name="payNote" defaultValue={c.payNote} placeholder="Card, bank transfer, cash or check" />
          </div>
          <TextArea label="Invoice terms" name="terms" defaultValue={c.terms} />
          <TradePicker selected={c.trades} />
        </ActionForm>
      </div>
    </>
  );
}
