"use client";

import { QueryProvider } from "./query-provider";
import { LenisProvider } from "./lenis-provider";
import { Toaster } from "sonner";
import { AuthInit } from "./auth-init";
import { RealtimeProvider } from "./realtime-provider";

export function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <LenisProvider>
        <AuthInit />
        <RealtimeProvider />
        {children}
        <Toaster theme="dark" position="top-right" />
      </LenisProvider>
    </QueryProvider>
  );
}

