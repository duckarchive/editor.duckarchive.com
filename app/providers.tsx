"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
  session?: Session;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children, themeProps,
  session, }: ProvidersProps) {
  const router = useRouter();

  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <HeroUIProvider navigate={router.push}>
        <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>
      </HeroUIProvider>
    </SessionProvider>
  );
}
