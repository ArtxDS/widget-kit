"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "./icon";

export type DropdownOption = { label: string; value: string };

export function Dropdown({
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      className={`dropdown relative ${className}`.trim()}
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null;
        if (!next || !event.currentTarget.contains(next)) setOpen(false);
      }}
      ref={rootRef}
    >
      <button
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        className={`dropdown-trigger
        w-full
        min-h-[38px]
        flex
        items-center
        justify-between
        gap-[10px]
        p-[0_12px]
        [border:1px_solid_#414248]
        rounded-[8px]
        text-[#e2e2e5]
        [background:linear-gradient(180deg,#242529,#1b1c20)]
        text-left
        text-[12px]
        cursor-pointer
        [transition:border-color_0.15s,background_0.15s,box-shadow_0.15s]
        [&:hover]:border-[#55565c]
        [&:hover]:[background:#2b2c30]
        aria-expanded:border-[#55565c]
        aria-expanded:[background:#2b2c30]
        aria-expanded:[box-shadow:0_0_0_3px_#ffffff0d]
        [&>span]:min-w-0
        [&>span]:truncate
        
        
        [&>svg]:flex-[0_0_auto]
        [&>svg]:text-[#9fa0b4]
        [&>svg]:[transition:transform_0.16s]
        [&>svg.is-open]:transform-[rotate(180deg)]
        [&>svg.is-open]:text-[#e0e0e3]
      `}
        onClick={() => setOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        <span>{selected?.label ?? "Choose an option"}</span>
        <Icon className={open ? "is-open" : ""} name="chevron-down" size={15} />
      </button>
      <div className={`dropdown-menu
        absolute
        z-60
        top-[calc(100%+6px)]
        left-0
        min-w-full
        w-max
        max-w-[min(280px,calc(100vw-36px))]
        max-h-[260px]
        overflow-y-auto
        p-[6px]
        [border:1px_solid_#414248]
        rounded-[10px]
        [background:#202125]
        [box-shadow:0_14px_38px_#0009]
      `} id={menuId} role="menu" aria-label={label} hidden={!open}>
        {options.map((option) => (
          <button
            aria-checked={option.value === value}
            className={(`dropdown-option${option.value === value ? " is-selected" : ""}`) + `
        w-full
        min-h-[36px]
        flex
        items-center
        justify-between
        gap-[18px]
        p-[0_12px]
        [border:0]
        rounded-[7px]
        text-[#c4c4d2]
        [background:transparent]
        text-left
        text-[12px]
        cursor-pointer
        [&:hover]:text-[white]
        [&:hover]:[background:#2c2d32]
        focus-visible:text-[white]
        focus-visible:[background:#2c2d32]
        [&.is-selected]:text-[#f0f0f2]
        [&.is-selected]:[background:#292a30]
        [&>svg]:text-[#c6c7cc]
      `}
            key={option.value}
            onClick={() => {
              onChange(option.value);
              setOpen(false);
              triggerRef.current?.focus();
            }}
            role="menuitemradio"
            type="button"
          >
            <span>{option.label}</span>
            {option.value === value && <Icon name="check" size={14} />}
          </button>
        ))}
      </div>
    </div>
  );
}
