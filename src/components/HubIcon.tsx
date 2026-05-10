interface Props { icon: string | null; name: string; size?: "sm" | "md" | "lg" }

export function HubIcon({ icon, name, size = "md" }: Props) {
  const dim = size === "lg" ? "w-16 h-16 text-xl" : size === "sm" ? "w-8 h-8 text-xs" : "w-12 h-12 text-sm";
  if (icon) {
    return <img src={icon} alt="" className={`${dim} rounded-xl object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`${dim} rounded-xl bg-neutral-800 flex items-center justify-center font-bold text-neutral-400 flex-shrink-0`}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
