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
import { emptyQualitySnapshot, type QualitySnapshot } from "@/lib/quality";

type QualityContextValue = {
  snapshot: QualitySnapshot;
  loading: boolean;
  running: boolean;
  runningComponentSlug: string | null;
  renderTimeHistory: number[];
  refresh: () => Promise<void>;
  runTests: () => Promise<void>;
  runComponentTests: (slug: string) => Promise<void>;
  recordRenderTime: (durationMs: number) => void;
};

const QualityContext = createContext<QualityContextValue | null>(null);

export function QualityProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState(emptyQualitySnapshot);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runningComponentSlug, setRunningComponentSlug] = useState<string | null>(null);
  const [renderTimeHistory, setRenderTimeHistory] = useState<number[]>([]);
  const renderSamples = useRef(0);

  const loadQuality = useCallback(async () => {
    try {
      const response = await fetch("/api/quality", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load the quality report.");
      const data = (await response.json()) as QualitySnapshot;
      setSnapshot((current) => ({
        ...data,
        averageRenderTimeMs: current.averageRenderTimeMs ?? data.averageRenderTimeMs,
      }));
    } catch {
      setSnapshot((current) => ({
        ...emptyQualitySnapshot,
        averageRenderTimeMs: current.averageRenderTimeMs,
        error: "Quality data is unavailable.",
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
          : (current.averageRenderTimeMs * (sampleCount - 1) + durationMs) / sampleCount,
    }));
  }, []);

  const runTests = useCallback(async () => {
    setRunning(true);
    try {
      const response = await fetch("/api/quality", { method: "POST" });
      const data = (await response.json()) as QualitySnapshot;
      if (!response.ok) {
        setSnapshot((current) => ({
          ...data,
          averageRenderTimeMs: current.averageRenderTimeMs ?? data.averageRenderTimeMs,
          error: data.error ?? "The test run failed.",
        }));
        return;
      }
      setSnapshot((current) => ({
        ...data,
        averageRenderTimeMs: current.averageRenderTimeMs ?? data.averageRenderTimeMs,
      }));
    } catch {
      setSnapshot((current) => ({
        ...current,
        error: "Could not start the test run. Check the development server.",
      }));
    } finally {
      setRunning(false);
    }
  }, []);

  const runComponentTests = useCallback(async (slug: string) => {
    setRunningComponentSlug(slug);
    try {
      const response = await fetch("/api/quality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentSlug: slug }),
      });
      const data = (await response.json()) as QualitySnapshot;
      setSnapshot((current) => ({
        ...current,
        ...data,
        testRun: current.testRun,
        history: current.history,
        coverage: current.coverage,
        componentTests: { ...current.componentTests, ...data.componentTests },
        averageRenderTimeMs: current.averageRenderTimeMs,
        error: data.error,
      }));
    } catch {
      setSnapshot((current) => ({
        ...current,
        error: "Could not run tests for this component. Check the development server.",
      }));
    } finally {
      setRunningComponentSlug(null);
    }
  }, []);

  const value = useMemo(
    () => ({ snapshot, loading, running, runningComponentSlug, renderTimeHistory, refresh, runTests, runComponentTests, recordRenderTime }),
    [snapshot, loading, running, runningComponentSlug, renderTimeHistory, refresh, runTests, runComponentTests, recordRenderTime],
  );

  return <QualityContext.Provider value={value}>{children}</QualityContext.Provider>;
}

export function useQuality() {
  const value = useContext(QualityContext);
  if (!value) throw new Error("useQuality must be used inside QualityProvider");
  return value;
}
