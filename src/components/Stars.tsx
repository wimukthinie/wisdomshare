export default function Stars({ value, count }: { value: number; count?: number }) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1 text-sm" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      <span aria-hidden="true" className="text-sun">
        {"★".repeat(rounded)}
        <span className="text-line">{"★".repeat(5 - rounded)}</span>
      </span>
      <span>{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-ink/60">({count})</span>}
    </span>
  );
}
