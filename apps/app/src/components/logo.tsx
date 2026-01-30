import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="font-bold text-primary text-xl md:text-2xl">
      sui<span className="text-primary/70">ntents</span>
    </Link>
  );
}
