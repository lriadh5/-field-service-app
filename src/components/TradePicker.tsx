import { TRADES, TRADE_KEYS, type Trade } from "@/lib/config";

const DETAIL: Record<Trade, string> = {
  appliance: "Model and serial records, warranty status, parts by model",
  hvac: "Unit age, tonnage and refrigerant, maintenance plans",
  handyman: "Flat-rate task menu, hourly and materials pricing",
  plumbing: "Fixture and water heater records, after-hours rates",
};

export function TradePicker({ selected = [] as Trade[] }: { selected?: Trade[] }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-[.8rem] font-semibold text-[var(--muted)] mb-1">Your trades</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {TRADE_KEYS.map((k) => (
          <label key={k} className="check">
            <input type="checkbox" name="trades" value={k} defaultChecked={selected.includes(k)} />
            <span>
              <b className="block font-semibold">{TRADES[k]}</b>
              <span className="text-xs text-[var(--muted)]">{DETAIL[k]}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
