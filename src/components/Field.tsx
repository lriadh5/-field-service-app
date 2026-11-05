type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string };

export function Field({ label, hint, id, name, ...rest }: InputProps) {
  const fid = id ?? `f-${name}`;
  return (
    <label className="field" htmlFor={fid}>
      <span>{label}</span>
      <input id={fid} name={name} className="input" {...rest} />
      {hint && <small className="text-xs text-[var(--muted)]">{hint}</small>}
    </label>
  );
}

export function TextArea({ label, id, name, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const fid = id ?? `f-${name}`;
  return (
    <label className="field" htmlFor={fid}>
      <span>{label}</span>
      <textarea id={fid} name={name} className="input" {...rest} />
    </label>
  );
}
