import { avatarColor, initials } from "@/lib/avatarColor";

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const { bg, text } = avatarColor(name);
  const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-12 w-12 text-base",
  }[size];

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${bg} ${text} ${sizeClasses}`}
    >
      {initials(name) || "?"}
    </span>
  );
}
