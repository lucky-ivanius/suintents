"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-bold text-6xl tracking-tight">404</h1>
      <p className="text-lg text-muted-foreground">This page could not be found.</p>
      <div className="mt-2 flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
        <Button nativeButton={false} render={<Link href="/">Go Home</Link>} />
      </div>
    </div>
  );
}
