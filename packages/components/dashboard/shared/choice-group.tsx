"use client";

import { Dropdown, type DropdownOption } from "./dropdown";

const BADGE_OPTION_LIMIT = 6;

export function ChoiceGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
}) {
  return (
    <div aria-label={label} className="option-badge-group" role="group">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            aria-pressed={selected}
            className={`option-badge${selected ? " is-selected" : ""}`}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function ChoiceControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
}) {
  if (options.length > BADGE_OPTION_LIMIT) {
    return (
      <Dropdown
        label={label}
        onChange={onChange}
        options={options}
        value={value}
      />
    );
  }

  return (
    <ChoiceGroup
      label={label}
      onChange={onChange}
      options={options}
      value={value}
    />
  );
}
