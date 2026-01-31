import { Exchange02Icon, TransactionHistoryIcon, Wallet01Icon } from "@hugeicons/core-free-icons";

export const NAVIGATIONS = [
  {
    label: "Swap",
    href: "/swap",
  },
  {
    label: "History",
    href: "/history",
  },
] as const;

export const MOBILE_NAVIGATIONS = [
  {
    label: "Swap",
    href: "/swap",
    icon: Exchange02Icon,
  },
  {
    label: "History",
    href: "/history",
    icon: TransactionHistoryIcon,
  },
  {
    label: "Account",
    href: "/account",
    icon: Wallet01Icon,
  },
] as const;
