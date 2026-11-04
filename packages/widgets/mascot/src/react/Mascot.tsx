"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
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

export const Mascot = forwardRef<MascotInstance | null, MascotProps>(
  function Mascot({ options, onReady, className = "", style, ...rest }, ref) {
    const hostRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<MascotInstance | null>(null);
    const optionsRef = useRef(options);
    const onReadyRef = useRef(onReady);
    const reactId = sanitizeId(useId());
    optionsRef.current = options;
    onReadyRef.current = onReady;

    useImperativeHandle(ref, () => {
      if (!instanceRef.current) {
        throw new Error("Mascot instance is not initialized.");
      }

      return instanceRef.current;
    }, []);

    useEffect(() => {
      const host = hostRef.current;
      if (!host) return undefined;
      const instance = createMascot(host, {
        ...optionsRef.current,
        idPrefix: optionsRef.current?.idPrefix ?? reactId,
      });
      instanceRef.current = instance;
      onReadyRef.current?.(instance);
      return () => {
        instance.destroy();
        instanceRef.current = null;
      };
      // Mount/unmount only. Option updates go through setOptions.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (options) instanceRef.current?.setOptions(options);
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
