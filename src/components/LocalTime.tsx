export default function LocalTime({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
    </time>
  );
}
