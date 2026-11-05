"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Blocks } from "lucide-react";
import { components, widgets } from "@/lib/catalog";
import type { IconName } from "../shared/icon";
import { Icon } from "../shared/icon";
import { QualityProvider } from "../quality/quality-provider";
import { TestRunToast } from "../quality/test-run-toast";
import { CatalogSidebar } from "../studio/catalog-sidebar";

const navItems: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Overview", icon: "overview" },
  { href: "/components", label: "Components", icon: "components" },
  { href: "/widgets", label: "Widgets", icon: "widgets" },
  { href: "/playground", label: "Playground", icon: "play" },
  { href: "/tests", label: "Tests & Performance", icon: "tests" },
  { href: "/notes", label: "Notes", icon: "notes" },
];

const headerLinks = [
  { href: "/components", label: "Components" },
  { href: "/widgets", label: "Widgets" },
  { href: "/tests", label: "Tests" },
  { href: "/docs", label: "Docs" },
  { href: "/notes", label: "Notes" },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isOverview = pathname === "/";
  const isStudio = pathname === "/playground" || pathname.startsWith("/components/");
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
      if (event.key === "Escape" && searchOpen) closeSearch();
    }
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [searchOpen]);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const pages = [...navItems, { href: "/docs", label: "Documentation", icon: "book" as const }]
      .map((item) => ({ ...item, kind: "Page", key: item.href }));
    const catalogItems = components.map((component) => ({
      href: `/components/${component.slug}`,
      label: component.name,
      icon: "components" as const,
      kind: "Component",
      key: component.slug,
    }));
    const widgetItems = widgets.map((widget) => ({
      href: `/playground?item=${widget.slug}`,
      label: widget.name,
      icon: "widgets" as const,
      kind: "Widget",
      key: widget.slug,
    }));
    return [...pages, ...catalogItems, ...widgetItems].filter((item) =>
      normalized ? item.label.toLowerCase().includes(normalized) : true,
    );
  }, [query]);
  const visibleResults = results.slice(0, 7);

  return (
    <QualityProvider>
      <div className="dashboard-frame">
        <header className="global-header">
          <Link className="global-brand" href="/" aria-label="widget-kit overview">
            <span className="global-brand-mark" aria-hidden="true"><Blocks size={27} strokeWidth={1.9} /></span>
            <strong>widget-kit</strong>
            <small>v0.1.0</small>
          </Link>

          <div
            className="search-control relative min-w-0"
            onBlur={(event) => {
              const next = event.relatedTarget as Node | null;
              if (!next || !event.currentTarget.contains(next)) setSearchOpen(false);
            }}
          >
            <div className="search-field">
              <Icon name="search" size={17} />
              <input
                aria-controls="topbar-search-results"
                aria-label="Search pages and components"
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search components, props, or documentation..."
                ref={inputRef}
                value={query}
              />
              {query ? (
                <button className="search-clear" type="button" aria-label="Clear search" onClick={() => setQuery("")}><Icon name="close" size={14} /></button>
              ) : <kbd>⌘ K</kbd>}
            </div>
            <div className="search-dropdown" id="topbar-search-results" role="region" aria-label="Search suggestions" hidden={!searchOpen}>
              <span className="nav-caption">{query ? "RESULTS" : "JUMP TO"}</span>
              {visibleResults.length ? visibleResults.map((item) => (
                <Link className="search-option" href={item.href} key={`${item.kind}-${item.key}`} onClick={closeSearch}>
                  <Icon name={item.icon} size={17} />
                  <span>{item.label}</span>
                  <small>{item.kind}</small>
                  <Icon className="search-option-arrow" name="arrow-right" size={15} />
                </Link>
              )) : <p className="search-empty">No matching pages or components.</p>}
            </div>
          </div>

          <nav aria-label="Catalog navigation" className="global-nav">
            {headerLinks.map((item) => (
              <Link
                aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <span aria-hidden="true" className="global-profile">WK</span>
        </header>

        <div className="dashboard-body">
          <Suspense fallback={<CatalogSidebarFallback pathname={pathname} />}>
            <CatalogSidebar pathname={pathname} />
          </Suspense>
          {isStudio ? (
            <div className="main-content main-content--studio">{children}</div>
          ) : (
            <main className={`main-content${isOverview ? " main-content--overview" : ""}`}>
              {children}
            </main>
          )}
        </div>
      </div>
      <TestRunToast />
    </QualityProvider>
  );
}

function CatalogSidebarFallback({ pathname }: { pathname: string }) {
  const hideCatalogHeader = pathname === "/" || pathname === "/widgets" || pathname === "/notes";
  return (
    <aside aria-hidden="true" className={`studio-catalog studio-catalog--global${hideCatalogHeader ? " studio-catalog--compact-header" : ""}`}>
      {!hideCatalogHeader && <div className="studio-catalog-heading"><h2>Components</h2></div>}
      {!hideCatalogHeader && <div className="studio-sidebar-skeleton" />}
    </aside>
  );
}
