"use client";

import { tw } from "@/lib/tailwind";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { components } from "@/lib/catalog";
import type { IconName } from "./icon";
import { Icon } from "./icon";
import { QualityProvider } from "./quality-provider";

const navItems: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Overview", icon: "overview" },
  { href: "/components", label: "Components", icon: "components" },
  { href: "/widgets", label: "Widgets", icon: "widgets" },
  { href: "/playground", label: "Playground", icon: "play" },
  { href: "/tests", label: "Tests & Performance", icon: "tests" },
  { href: "/notes", label: "Notes", icon: "notes" },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  function closeSearch() {
    setQuery("");
    setSearchOpen(false);
    inputRef.current?.blur();
  }

  useEffect(() => {
    function onShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        inputRef.current?.focus();
      }
      if (event.key === "Escape" && searchOpen) {
        setQuery("");
        setSearchOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [searchOpen]);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const pages = [...navItems, { href: "/docs", label: "Documentation", icon: "book" as const }].map((item) => ({ ...item, kind: "Page", key: item.href }));
    const catalogItems = components.map((component) => ({
      href: `/components/${component.slug}`,
      label: component.name,
      icon: "components" as const,
      kind: "Component",
      key: component.slug,
    }));
    return [...pages, ...catalogItems].filter((item) =>
      normalized ? item.label.toLowerCase().includes(normalized) : true,
    );
  }, [query]);
  const visibleResults = results.slice(0, 7);

  return (
    <QualityProvider>
      <div className={tw("dashboard-frame")}>
        <aside className={tw("sidebar")}>
          <Link className={tw("brand")} href="/" aria-label="widget-kit overview">
            <span className={tw("brand-mark")} aria-hidden="true">
              <i /><i /><i />
            </span>
            <span className={tw("brand-copy")}>
              <strong>widget-kit</strong>
              <span>v0.1.0</span>
            </span>
          </Link>

          <nav aria-label="Main navigation" className={tw("side-nav")}>
            <span className={tw("nav-caption")}>WORKSPACE</span>
            {navItems.map((item) => {
              const active = item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={tw(`nav-link${active ? " is-active" : ""}`)}
                  href={item.href}
                  aria-label={item.label}
                  key={item.href}
                  title={item.label}
                >
                  <Icon name={item.icon} size={19} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className={tw("sidebar-bottom")}>
            <div className={tw("dev-status")}>
              <span className={tw("status-light")} />
              <div><strong>Development Mode</strong><span>Local workspace</span></div>
              <Icon className={tw("dev-wave")} name="activity" size={22} />
            </div>
            <p className={tw("sidebar-motto")}><Icon name="sparkles" size={15} /> Build once. Reuse everywhere.</p>
          </div>
        </aside>

        <div className={tw("main-column")}>
          <header className={tw(`topbar${pathname === "/" ? " topbar--overview" : ""}`)}>
            <div
              className={tw("search-control")}
              onBlur={(event) => {
                const next = event.relatedTarget as Node | null;
                if (!next || !event.currentTarget.contains(next)) setSearchOpen(false);
              }}
            >
              <div className={tw("search-field")}>
                <Icon name="search" size={18} />
                <input
                  aria-controls="topbar-search-results"
                  aria-label="Search pages and components"
                  onChange={(event) => setQuery(event.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search pages and components..."
                  ref={inputRef}
                  value={query}
                />
                {query ? <button className={tw("search-clear")} type="button" aria-label="Clear search" onClick={() => setQuery("")}><Icon name="close" size={14} /></button> : <kbd>⌘ K</kbd>}
              </div>
              <div className={tw("search-dropdown")} id="topbar-search-results" role="region" aria-label="Search suggestions" hidden={!searchOpen}>
                <span className={tw("nav-caption")}>{query ? "RESULTS" : "JUMP TO"}</span>
                {visibleResults.length ? visibleResults.map((item) => (
                  <Link className={tw("search-option")} href={item.href} key={`${item.kind}-${item.key}`} onClick={closeSearch}>
                    <Icon name={item.icon} size={17} />
                    <span>{item.label}</span>
                    <small>{item.kind}</small>
                    <Icon className={tw("search-option-arrow")} name="arrow-right" size={15} />
                  </Link>
                )) : <p className={tw("search-empty")}>No matching pages or components.</p>}
              </div>
            </div>
          </header>

          <main className={tw(`main-content${pathname === "/" ? " main-content--overview" : ""}`)}>{children}</main>
        </div>
      </div>

    </QualityProvider>
  );
}
