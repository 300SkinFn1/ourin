"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { RefreshCw, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { getModelInfo, type ReasoningPreset } from "@/lib/models";
import { useCores } from "@/hooks/useCores";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useModelAccess } from "@/hooks/useModelAccess";
import { ModelList } from "./shared/ModelList";
import { CoreList } from "./shared/CoreList";

interface RegenerateConfigPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onRegenerate: (model: string, reasoningLevel?: string | number) => void;
  messageModel?: string;
  messageReasoningLevel?: string | number;
  messageCoreNames?: string[];
  fallbackModel: string;
  anchorRef: React.RefObject<HTMLElement | null>;
}

function getDefaultReasoningLevel(modelId: string): string | number {
  const modelInfo = getModelInfo(modelId);
  if (!modelInfo.reasoningParameter) {
    return "medium";
  }
  return modelInfo.reasoningParameter.defaultValue ?? "medium";
}

export function RegenerateConfigPopover({
  isOpen,
  onClose,
  onRegenerate,
  messageModel,
  messageReasoningLevel,
  messageCoreNames,
  fallbackModel,
}: RegenerateConfigPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Model access (tier checking)
  const { canAccessModel, getLockReason, canAccessAllModels } =
    useModelAccess();

  // Initial model from message or fallback
  const initialModel = messageModel || fallbackModel;

  const [selectedModel, setSelectedModel] = useState(initialModel);
  const [selectedReasoningLevel, setSelectedReasoningLevel] = useState<
    string | number
  >(messageReasoningLevel ?? getDefaultReasoningLevel(initialModel));
  const [search, setSearch] = useState("");

  // Cores data
  const { cores, setActiveCoresByIds } = useCores();

  // Local state for which cores are active
  const [localActiveCores, setLocalActiveCores] = useState<Set<string>>(
    new Set()
  );

  // Track previous isOpen to detect when popover opens
  const wasOpenRef = useRef(false);

  // Reset state when opening
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      const model = messageModel || fallbackModel;
      setSelectedModel(model);
      setSelectedReasoningLevel(
        messageReasoningLevel ?? getDefaultReasoningLevel(model)
      );
      setSearch("");

      // Initialize local active cores from message's coreNames
      if (messageCoreNames && messageCoreNames.length > 0 && cores) {
        const activeIds = new Set<string>();
        for (const core of cores) {
          if (messageCoreNames.includes(core.name)) {
            activeIds.add(core.id);
          }
        }
        if (activeIds.size === 0) {
          for (const core of cores) {
            if (core.isActive) {
              activeIds.add(core.id);
            }
          }
        }
        setLocalActiveCores(activeIds);
      } else if (cores) {
        const activeIds = new Set<string>();
        for (const core of cores) {
          if (core.isActive) {
            activeIds.add(core.id);
          }
        }
        setLocalActiveCores(activeIds);
      }

      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
    wasOpenRef.current = isOpen;
  }, [
    isOpen,
    messageModel,
    messageReasoningLevel,
    messageCoreNames,
    fallbackModel,
    cores,
  ]);

  // Close handlers using shared hooks
  useClickOutside(popoverRef, onClose, isOpen);
  useEscapeKey(onClose, isOpen);

  // Handle model selection - also reset reasoning level
  const handleModelSelect = useCallback((modelId: string) => {
    setSelectedModel(modelId);
    setSelectedReasoningLevel(getDefaultReasoningLevel(modelId));
  }, []);

  // Toggle local core active state
  const toggleLocalCore = useCallback((coreId: string) => {
    setLocalActiveCores((prev) => {
      const next = new Set(prev);
      if (next.has(coreId)) {
        if (next.size > 1) {
          next.delete(coreId);
        }
      } else {
        next.add(coreId);
      }
      return next;
    });
  }, []);

  // Check if a core is active (for CoreList)
  const getIsActive = useCallback(
    (core: { id: string }) => localActiveCores.has(core.id),
    [localActiveCores]
  );

  const handleRegenerate = async () => {
    await setActiveCoresByIds(localActiveCores);

    const modelInfo = getModelInfo(selectedModel);
    const isReasoningModel = !!modelInfo.reasoningParameter;

    onRegenerate(
      selectedModel,
      isReasoningModel ? selectedReasoningLevel : undefined
    );
    onClose();
  };

  if (!isOpen) return null;

  const modelInfo = getModelInfo(selectedModel);
  const isReasoningModel = !!modelInfo.reasoningParameter;

  // Get reasoning options for the selected model
  const getReasoningOptions = () => {
    if (!modelInfo.reasoningParameter) return [];

    const { kind, allowedValues, presets } = modelInfo.reasoningParameter;

    if (kind === "effort" && allowedValues) {
      return allowedValues.map((v) => ({
        key: v,
        label: v.charAt(0).toUpperCase() + v.slice(1),
        value: v,
      }));
    }

    if (presets) {
      return presets.map((p: ReasoningPreset) => ({
        key: p.key,
        label: p.label,
        value: p.value,
      }));
    }

    return [];
  };

  const reasoningOptions = getReasoningOptions();

  return (
    <div
      ref={popoverRef}
      className="z-50 absolute shadow-lg rounded-sm w-[480px] overflow-hidden"
      style={{
        backgroundColor: "var(--color-background-elevated)",
        border: "1px solid var(--color-border-default)",
        left: 0,
        bottom: "100%",
        marginBottom: "8px",
      }}
    >
      {/* Search */}
      <div
        className="p-2"
        style={{ borderBottom: "1px solid var(--color-border-muted)" }}
      >
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-sm"
          style={{ backgroundColor: "var(--color-background-input)" }}
        >
          <Search
            className="w-4 h-4 shrink-0"
            style={{ color: "var(--color-text-muted)" }}
          />
          <input
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search models & cores..."
            className="flex-1 bg-transparent border-none outline-none focus:outline-none ring-0 focus:ring-0 text-sm"
            style={{ color: "var(--color-text-primary)" }}
          />
          <button
            onClick={onClose}
            className="hover:bg-[var(--color-background-hover)] p-1 rounded transition-colors"
            style={{ color: "var(--color-text-muted)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex max-h-[320px]">
        {/* Models column (left) */}
        <div style={{ borderRight: "1px solid var(--color-border-muted)" }}>
          <ModelList
            selectedModel={selectedModel}
            onSelect={handleModelSelect}
            search={search}
            canAccessModel={canAccessModel}
            getLockReason={getLockReason}
            canAccessAllModels={canAccessAllModels}
            showCheckmark
          />
        </div>

        {/* Cores column (right) */}
        <div className="flex flex-col flex-1">
          <CoreList
            cores={cores}
            search={search}
            getIsActive={getIsActive}
            onToggle={toggleLocalCore}
          />

          {/* Reasoning options (sticky footer, only for reasoning models) */}
          {isReasoningModel && reasoningOptions.length > 0 && (
            <div
              className="p-1.5 shrink-0"
              style={{ borderTop: "1px solid var(--color-border-muted)" }}
            >
              <div
                className="px-2.5 py-1 font-medium text-xs uppercase tracking-wider"
                style={{ color: "var(--color-text-muted)" }}
              >
                {modelInfo.reasoningParameter?.kind === "effort"
                  ? "Reasoning"
                  : "Thinking"}
              </div>
              <div className="flex flex-wrap gap-1 px-1">
                {reasoningOptions.map((option) => {
                  const isSelected = option.value === selectedReasoningLevel;
                  return (
                    <button
                      key={option.key}
                      onClick={() => setSelectedReasoningLevel(option.value)}
                      className={cn(
                        "px-2.5 py-1 rounded-sm text-sm transition-colors",
                        isSelected
                          ? ""
                          : "hover:bg-[var(--color-background-hover)]"
                      )}
                      style={{
                        backgroundColor: isSelected
                          ? "var(--color-accent-primary-muted)"
                          : undefined,
                        color: isSelected
                          ? "var(--color-accent-primary)"
                          : "var(--color-text-secondary)",
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer with regenerate button */}
      <div
        className="flex justify-end px-3 py-2"
        style={{ borderTop: "1px solid var(--color-border-muted)" }}
      >
        <button
          onClick={handleRegenerate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm transition-colors"
          style={{
            backgroundColor: "var(--color-accent-primary)",
            color: "var(--color-text-inverse)",
          }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Regenerate
        </button>
      </div>
    </div>
  );
}
