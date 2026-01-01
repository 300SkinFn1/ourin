"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { usePostHog } from "posthog-js/react";
import { isPostHogEnabled } from "./PostHogProvider";

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    if (!pathname || !posthog) return;

    const url = searchParams?.toString()
      ? `${window.origin}${pathname}?${searchParams.toString()}`
      : `${window.origin}${pathname}`;

    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, posthog]);

  return null;
}

export function PostHogPageView() {
  if (!isPostHogEnabled) return null;

  return (
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  );
}
