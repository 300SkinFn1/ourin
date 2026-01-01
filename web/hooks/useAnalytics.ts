"use client";

import { useCallback } from "react";
import { usePostHog } from "posthog-js/react";
import { isPostHogEnabled } from "@/components/providers/PostHogProvider";

// Event property types
interface MessageEventProps {
  conversationId?: string;
  model: string;
  provider: string;
  reasoningLevel?: string | number;
  reasoningEnabled?: boolean;
  webSearchEnabled?: boolean;
  attachmentsCount?: number;
  coreNames?: string[];
  messageLength?: number;
}

interface SubscriptionEventProps {
  tier: string;
  action:
    | "checkout_started"
    | "subscription_created"
    | "subscription_cancelled"
    | "credits_purchased";
  creditsAmount?: number;
  priceCents?: number;
}

type AuthMethod = "email" | "github" | "google" | "anonymous";

/**
 * Hook for tracking analytics events.
 * All methods are no-ops if PostHog is not configured.
 */
export function useAnalytics() {
  const posthog = usePostHog();

  const capture = useCallback(
    (event: string, properties?: Record<string, unknown>) => {
      if (!isPostHogEnabled || !posthog) return;
      posthog.capture(event, properties);
    },
    [posthog]
  );

  // Chat events
  const trackMessageSent = useCallback(
    (props: MessageEventProps) => capture("message_sent", { ...props }),
    [capture]
  );

  const trackMessageRegenerated = useCallback(
    (props: MessageEventProps) => capture("message_regenerated", { ...props }),
    [capture]
  );

  const trackMessageEdited = useCallback(
    (props: MessageEventProps) => capture("message_edited", { ...props }),
    [capture]
  );

  const trackConversationCreated = useCallback(
    (conversationId: string, model: string) =>
      capture("conversation_created", { conversationId, model }),
    [capture]
  );

  const trackConversationForked = useCallback(
    (sourceId: string, newId: string) =>
      capture("conversation_forked", {
        sourceConversationId: sourceId,
        newConversationId: newId,
      }),
    [capture]
  );

  const trackStreamStopped = useCallback(
    (conversationId: string, reason: "user_abort" | "error") =>
      capture("stream_stopped", { conversationId, reason }),
    [capture]
  );

  // Model & feature events
  const trackModelChanged = useCallback(
    (previousModel: string, newModel: string, provider: string) =>
      capture("model_changed", { previousModel, newModel, provider }),
    [capture]
  );

  const trackThemeChanged = useCallback(
    (themeId: string, isCustom: boolean) =>
      capture("theme_changed", { themeId, isCustom }),
    [capture]
  );

  const trackFileUploaded = useCallback(
    (category: string, mimeType: string, sizeBytes: number) =>
      capture("file_uploaded", { category, mimeType, sizeBytes }),
    [capture]
  );

  // Subscription events
  const trackSubscriptionEvent = useCallback(
    (props: SubscriptionEventProps) =>
      capture("subscription_event", { ...props }),
    [capture]
  );

  // Auth events
  const trackSignUp = useCallback(
    (method: AuthMethod) => capture("user_signed_up", { method }),
    [capture]
  );

  const trackSignIn = useCallback(
    (method: AuthMethod) => capture("user_signed_in", { method }),
    [capture]
  );

  const trackAccountUpgraded = useCallback(
    () => capture("account_upgraded", { from: "anonymous" }),
    [capture]
  );

  // Generic UI interaction
  const trackUIInteraction = useCallback(
    (
      element: string,
      action: "click" | "open" | "close" | "toggle",
      metadata?: Record<string, unknown>
    ) => capture("ui_interaction", { element, action, ...metadata }),
    [capture]
  );

  return {
    capture,
    // Chat
    trackMessageSent,
    trackMessageRegenerated,
    trackMessageEdited,
    trackConversationCreated,
    trackConversationForked,
    trackStreamStopped,
    // Features
    trackModelChanged,
    trackThemeChanged,
    trackFileUploaded,
    // Subscription
    trackSubscriptionEvent,
    // Auth
    trackSignUp,
    trackSignIn,
    trackAccountUpgraded,
    // UI
    trackUIInteraction,
  };
}
