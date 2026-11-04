"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  emptyQualitySnapshot,
  itemTestKey,
  type QualitySnapshot,
  type TestTargetType,
} from "@/lib/quality";
import { components, widgets } from "@/lib/catalog";

export type TestRunToastState = {
  id: number;
  open: boolean;
  itemName: string;
  itemType: TestTargetType;
  status: "loading" | "success" | "warning" | "error";
  currentStep: number;
  summary?: string;
  error?: string;
};

type QualityContextValue = {
  snapshot: QualitySnapshot;
  loading: boolean;
  runningItemKey: string | null;
  testRunToast: TestRunToastState | null;
  renderTimeHistory: number[];
  refresh: () => Promise<void>;
  runItemTests: (itemType: TestTargetType, itemSlug: string) => Promise<void>;
  dismissTestRunToast: () => void;
  recordRenderTime: (durationMs: number) => void;
};

const QualityContext = createContext<QualityContextValue | null>(null);

export function QualityProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState(emptyQualitySnapshot);
  const [loading, setLoading] = useState(true);
  const [runningItemKey, setRunningItemKey] = useState<string | null>(null);
  const [testRunToast, setTestRunToast] = useState<TestRunToastState | null>(null);
  const [renderTimeHistory, setRenderTimeHistory] = useState<number[]>([]);
  const renderSamples = useRef(0);
  const toastId = useRef(0);
  const activeToastId = useRef<number | null>(null);
  const toastTimer = useRef<number | null>(null);
  const toastExitTimer = useRef<number | null>(null);

  const scheduleToastDismiss = useCallback((id: number, delay: number) => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => {
      toastTimer.current = null;
      if (activeToastId.current !== id) return;
      activeToastId.current = null;
      setTestRunToast((current) =>
        current?.id === id ? { ...current, open: false } : current,
      );
      toastExitTimer.current = window.setTimeout(() => {
        setTestRunToast((current) => (current?.id === id ? null : current));
        toastExitTimer.current = null;
      }, 220);
    }, delay);
  }, []);

  const dismissTestRunToast = useCallback(() => {
    const id = activeToastId.current;
    toastId.current += 1;
    activeToastId.current = null;
    if (toastTimer.current !== null) {
      window.clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }
    if (toastExitTimer.current !== null) {
      window.clearTimeout(toastExitTimer.current);
      toastExitTimer.current = null;
    }
    if (id === null) {
      setTestRunToast(null);
      return;
    }
    setTestRunToast((current) =>
      current?.id === id ? { ...current, open: false } : current,
    );
    toastExitTimer.current = window.setTimeout(() => {
      setTestRunToast((current) => (current?.id === id ? null : current));
      toastExitTimer.current = null;
    }, 220);
  }, []);

  const loadQuality = useCallback(async () => {
    try {
      const response = await fetch("/api/quality", { cache: "no-store" });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | QualitySnapshot
          | null;
        throw new Error(data?.error ?? "Could not load the quality report.");
      }
      const data = (await response.json()) as QualitySnapshot;
      setSnapshot((current) => ({
        ...data,
        averageRenderTimeMs:
          current.averageRenderTimeMs ?? data.averageRenderTimeMs,
      }));
    } catch (error) {
      setSnapshot((current) => ({
        ...emptyQualitySnapshot,
        averageRenderTimeMs: current.averageRenderTimeMs,
        error:
          error instanceof Error ? error.message : "Quality data is unavailable.",
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadQuality(), 0);
    return () => window.clearTimeout(timer);
  }, [loadQuality]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await loadQuality();
  }, [loadQuality]);

  const recordRenderTime = useCallback((durationMs: number) => {
    renderSamples.current += 1;
    const sampleCount = renderSamples.current;
    setRenderTimeHistory((current) => [...current.slice(-7), durationMs]);
    setSnapshot((current) => ({
      ...current,
      averageRenderTimeMs:
        current.averageRenderTimeMs === null
          ? durationMs
          : (current.averageRenderTimeMs * (sampleCount - 1) + durationMs) /
            sampleCount,
    }));
  }, []);

  const runItemTests = useCallback(
    async (itemType: TestTargetType, itemSlug: string) => {
      const key = itemTestKey(itemType, itemSlug);
      const catalog = itemType === "component" ? components : widgets;
      const itemName = catalog.find((item) => item.slug === itemSlug)?.name ?? itemSlug;
      const id = ++toastId.current;
      activeToastId.current = id;
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
      if (toastExitTimer.current !== null) window.clearTimeout(toastExitTimer.current);
      setRunningItemKey(key);
      setTestRunToast({
        id,
        open: true,
        itemName,
        itemType,
        status: "loading",
        currentStep: 1,
      });
      try {
        const response = await fetch("/api/quality", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemType, itemSlug }),
        });
        const data = (await response.json()) as QualitySnapshot;
        const result = data.history?.find(
          (run) => run.itemType === itemType && run.itemSlug === itemSlug,
        );
        const status = result?.failed
          ? "warning"
          : response.ok
            ? "success"
            : "error";
        setSnapshot((current) => ({
          ...data,
          averageRenderTimeMs: current.averageRenderTimeMs,
          error: response.ok ? data.error : data.error ?? "The item test run failed.",
        }));
        if (toastId.current === id) {
          setTestRunToast({
            id,
            open: true,
            itemName,
            itemType,
            status,
            currentStep: status === "error" ? 1 : 3,
            summary: result
              ? `${result.passed}/${result.total} passed · ${result.failed} failed · ${(result.durationMs / 1000).toFixed(2)}s`
              : undefined,
            error: status === "error" ? data.error : undefined,
          });
          scheduleToastDismiss(id, 6000);
        }
      } catch (error) {
        setSnapshot((current) => ({
          ...current,
          error:
            error instanceof Error
              ? error.message
              : "Could not start the test run. Check the development server.",
        }));
        if (toastId.current === id) {
          setTestRunToast({
            id,
            open: true,
            itemName,
            itemType,
            status: "error",
            currentStep: 1,
            error:
              error instanceof Error
                ? error.message
                : "Could not start the test run. Check the development server.",
          });
          scheduleToastDismiss(id, 7000);
        }
      } finally {
        setRunningItemKey(null);
      }
    },
    [scheduleToastDismiss],
  );

  const value = useMemo(
    () => ({
      snapshot,
      loading,
      runningItemKey,
      testRunToast,
      renderTimeHistory,
      refresh,
      runItemTests,
      dismissTestRunToast,
      recordRenderTime,
    }),
    [
      snapshot,
      loading,
      runningItemKey,
      testRunToast,
      renderTimeHistory,
      refresh,
      runItemTests,
      dismissTestRunToast,
      recordRenderTime,
    ],
  );

  return <QualityContext.Provider value={value}>{children}</QualityContext.Provider>;
}

export function useQuality() {
  const value = useContext(QualityContext);
  if (!value) throw new Error("useQuality must be used inside QualityProvider");
  return value;
}
