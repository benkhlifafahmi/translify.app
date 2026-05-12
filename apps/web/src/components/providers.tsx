"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { I18nProvider } from "@/lib/i18n";
import { LumiProvider } from "@/components/lumi/lumi-context";
import { LumiToastStack } from "@/components/lumi/lumi-toast-stack";
import { PHProvider, PostHogPageview } from "@/components/posthog-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );
  return (
    <PHProvider>
      <QueryClientProvider client={client}>
        <I18nProvider>
          <LumiProvider>
            <PostHogPageview />
            {children}
            <LumiToastStack />
          </LumiProvider>
        </I18nProvider>
      </QueryClientProvider>
    </PHProvider>
  );
}
