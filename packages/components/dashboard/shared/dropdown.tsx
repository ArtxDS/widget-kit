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
        [width:100%]
        [min-height:38px]
        flex
        items-center
        justify-between
        [gap:10px]
        [padding:0_12px]
        [border:1px_solid_#414248]
        [border-radius:8px]
        [color:#e2e2e5]
        [background:linear-gradient(180deg,_#242529,_#1b1c20)]
        [text-align:left]
        [font-size:12px]
        [cursor:pointer]
        [transition:border-color_0.15s,_background_0.15s,_box-shadow_0.15s]
        [&:hover]:[border-color:#55565c]
        [&:hover]:[background:#2b2c30]
        [&[aria-expanded="true"]]:[border-color:#55565c]
        [&[aria-expanded="true"]]:[background:#2b2c30]
        [&[aria-expanded="true"]]:[box-shadow:0_0_0_3px_#ffffff0d]
        [&>span]:min-w-0
        [&>span]:overflow-hidden
        [&>span]:[text-overflow:ellipsis]
        [&>span]:[white-space:nowrap]
        [&>svg]:[flex:0_0_auto]
        [&>svg]:[color:#9fa0b4]
        [&>svg]:[transition:transform_0.16s]
        [&>svg.is-open]:[transform:rotate(180deg)]
        [&>svg.is-open]:[color:#e0e0e3]
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
        [z-index:60]
        [top:calc(100%_+_6px)]
        [left:0]
        [min-width:100%]
        [width:max-content]
        [max-width:min(280px,_calc(100vw_-_36px))]
        [max-height:260px]
        [overflow-y:auto]
        [padding:6px]
        [border:1px_solid_#414248]
        [border-radius:10px]
        [background:#202125]
        [box-shadow:0_14px_38px_#0009]
      `} id={menuId} role="menu" aria-label={label} hidden={!open}>
        {options.map((option) => (
          <button
            aria-checked={option.value === value}
            className={(`dropdown-option${option.value === value ? " is-selected" : ""}`) + `
        [width:100%]
        [min-height:36px]
        flex
        items-center
        justify-between
        [gap:18px]
        [padding:0_12px]
        [border:0]
        [border-radius:7px]
        [color:#c4c4d2]
        [background:transparent]
        [text-align:left]
        [font-size:12px]
        [cursor:pointer]
        [&:hover]:[color:white]
        [&:hover]:[background:#2c2d32]
        [&:focus-visible]:[color:white]
        [&:focus-visible]:[background:#2c2d32]
        [&.is-selected]:[color:#f0f0f2]
        [&.is-selected]:[background:#292a30]
        [&>svg]:[color:#c6c7cc]
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
