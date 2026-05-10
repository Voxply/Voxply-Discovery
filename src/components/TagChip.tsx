interface Props { tag: string; href?: string }

export function TagChip({ tag, href }: Props) {
  const cls = "text-xs px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 hover:bg-indigo-900 transition-colors";
  if (href) return <a href={href} className={cls}>{tag}</a>;
  return <span className={cls}>{tag}</span>;
}
