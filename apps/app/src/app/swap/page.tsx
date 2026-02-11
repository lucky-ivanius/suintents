import type { NextPage } from "next";
import { redirect } from "next/navigation";

import type { SearchParams } from "@/lib/search-params";
import { SwapCard } from "@/components/swap-card";
import { toArray } from "@/lib/search-params";

const SwapPage: NextPage<{ searchParams: Promise<SearchParams> }> = async ({ searchParams }) => {
  const resolvedSearchParams = await searchParams;

  const [from] = toArray(resolvedSearchParams.from);
  const [to] = toArray(resolvedSearchParams.to);

  if (from && to && from === to) return redirect("/swap");

  return (
    <div className="flex items-center justify-center md:pt-16">
      <SwapCard from={from} to={to} />
    </div>
  );
};

export default SwapPage;
