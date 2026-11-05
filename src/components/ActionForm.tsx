"use client";
import { startTransition, useActionState, useState } from "react";
import type { FormState } from "@/app/actions/types";

type Props = {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  submitLabel: string;
  pendingLabel?: string;
  children?: React.ReactNode;
  className?: string;
  buttonClass?: string;
  /** Inline forms (a single button) render their message after the button. */
  inline?: boolean;
};

/** A form that posts to a server action, keeps typed values on error, and shows the result. */
export function ActionForm({ action, submitLabel, pendingLabel, children, className, buttonClass = "btn btn-primary", inline }: Props) {
  const [state, dispatch, pending] = useActionState(action, null);
  const [copied, setCopied] = useState(false);
  return (
    <form
      className={className ?? (inline ? "flex flex-wrap items-center gap-2" : "flex flex-col gap-3")}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => dispatch(data));
      }}
    >
      {children}
      {state?.error && <p role="alert" className="alert alert-error">{state.error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" className={buttonClass} disabled={pending}>{pending ? pendingLabel ?? "Saving…" : submitLabel}</button>
      </div>
      {state?.ok && (
        <div role="status" className="alert alert-ok flex flex-col gap-2">
          <span>{state.ok}</span>
          {state.link && (
            <div className="flex flex-wrap items-center gap-2">
              <code className="mono text-xs break-all select-all bg-[var(--surface)] rounded px-2 py-1 min-w-0 flex-1">{state.link}</code>
              <button
                type="button"
                className="btn btn-sm"
                onClick={async () => {
                  try { await navigator.clipboard.writeText(state.link!); setCopied(true); } catch { setCopied(false); }
                }}
              >
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
