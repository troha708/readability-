import Link from "next/link";

type Props = {
  compact?: boolean;
};

export function Logo({ compact = false }: Props) {
  return (
    <Link
      href="/"
      className={`font-bold text-gray-900 transition-colors hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400 ${
        compact ? "text-base" : "text-xl"
      }`}
    >
      Readability
    </Link>
  );
}
