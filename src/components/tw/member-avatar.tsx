import { cn } from "@/lib/utils";
import { initials, type Member } from "@/lib/social";

const SIZES = { sm: "h-9 w-9 text-xs", md: "h-11 w-11 text-sm", lg: "h-16 w-16 text-lg", xl: "h-24 w-24 text-2xl" };

export function MemberAvatar({ m, size = "md", className }: { m?: Pick<Member, "full_name" | "avatar_url"> | null; size?: keyof typeof SIZES; className?: string }) {
  const s = SIZES[size];
  if (m?.avatar_url) return <img src={m.avatar_url} alt="" className={cn(s, "shrink-0 rounded-full border object-cover", className)} />;
  return (
    <span className={cn(s, "inline-flex shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gradient-to-br from-cyan/15 to-gold/20 font-display font-semibold text-foreground", className)}>
      {initials(m?.full_name)}
    </span>
  );
}
