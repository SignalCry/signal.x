"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function LayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/auth";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto mb-5 mt-8 min-h-[calc(100vh-4rem)] w-[90%] max-w-6xl">
      {children}
    </div>
  );
}
