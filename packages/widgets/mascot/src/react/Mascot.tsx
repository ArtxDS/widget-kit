"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import { createMascot } from "../core/createMascot";
import type { MascotInstance, MascotOptions } from "../core/types";

export type MascotProps = {
  options?: MascotOptions;
  onReady?: (instance: MascotInstance) => void;
  className?: string;
  style?: CSSProperties;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

function sanitizeId(value: string): string {
  return value.replace(/:/g, "");
}


function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function areMascotOptionsEqual(
  left: MascotOptions | undefined,
  right: MascotOptions | undefined,
): boolean {
  if (left === right) return true;
  if (!left || !right) return false;

  const keys = new Set([
    ...Object.keys(left),
    ...Object.keys(right),
  ]) as Set<keyof MascotOptions>;

  for (const key of keys) {
    const leftValue = (left as Record<string, unknown>)[key as string];
    const rightValue = (right as Record<string, unknown>)[key as string];
    if (Object.is(leftValue, rightValue)) continue;

    if (isPlainObject(leftValue) && isPlainObject(rightValue)) {
      const nestedKeys = new Set([
        ...Object.keys(leftValue),
        ...Object.keys(rightValue),
      ]);
      for (const nestedKey of nestedKeys) {
        if (!Object.is((leftValue as Record<string, unknown>)[nestedKey], (rightValue as Record<string, unknown>)[nestedKey])) {
          return false;
        }
      }
      continue;
    }

    return false;
  }

  return true;
}

export const Mascot = forwardRef<MascotInstance | null, MascotProps>(
  function Mascot({ options, onReady, className = "", style, ...rest }, ref) {
    const hostRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<MascotInstance | null>(null);
    const [instance, setInstance] = useState<MascotInstance | null>(null);
    const isFirstOptionsEffect = useRef(true);
    const previousOptionsRef = useRef(options);
    const optionsRef = useRef(options);
    const onReadyRef = useRef(onReady);
    const reactId = sanitizeId(useId());
    optionsRef.current = options;
    onReadyRef.current = onReady;

    useImperativeHandle<MascotInstance | null, MascotInstance | null>(ref, () => instance, [instance]);

    useEffect(() => {
      const host = hostRef.current;
      if (!host) return undefined;
      const next = createMascot(host, {
        ...optionsRef.current,
        idPrefix: optionsRef.current?.idPrefix ?? reactId,
      });
      instanceRef.current = next;
      setInstance(next);
      onReadyRef.current?.(next);
      return () => {
        next.destroy();
        instanceRef.current = null;
        setInstance(null);
      };
      // Mount/unmount only. Option updates go through setOptions.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (isFirstOptionsEffect.current) {
        isFirstOptionsEffect.current = false;
        previousOptionsRef.current = options;
        return;
      }

      if (!options) {
        previousOptionsRef.current = options;
        return;
      }

      if (areMascotOptionsEqual(previousOptionsRef.current, options)) {
        previousOptionsRef.current = options;
        return;
      }

      previousOptionsRef.current = options;
      instanceRef.current?.setOptions(options);
    }, [options]);

    return (
      <div
        ref={hostRef}
        className={`wk-mascot-host ${className}`.trim()}
        style={style}
        {...rest}
      />
    );
  },
);
