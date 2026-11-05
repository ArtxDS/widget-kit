"use client";

import { components, widgets } from "@/lib/catalog";
import { ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "../shared/icon";

const workspaceRoutes = [
  { href: "/components", label: "Components", icon: "components" as const },
  { href: "/widgets", label: "Widgets", icon: "widgets" as const },
  { href: "/playground", label: "Playground", icon: "play" as const },
  { href: "/tests", label: "Tests & Performance", icon: "tests" as const },
];

export function CatalogSidebar({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const normalized = query.trim().toLowerCase();
  const componentItems = components
    .map((item) => ({
      slug: item.slug,
      name: item.name,
      category: item.category,
      href: `/components/${item.slug}`,
      icon: "components" as const,
    }))
    .filter((item) =>
      `${item.name} ${item.category}`.toLowerCase().includes(normalized),
    );
  const experimentalItems = widgets
    .map((item) => ({
      slug: item.slug,
      name: item.name,
      category: item.category,
      href: `/playground?item=${item.slug}&mode=playground`,
      icon: "widgets" as const,
    }))
    .filter((item) =>
      `${item.name} ${item.category}`.toLowerCase().includes(normalized),
    );
  const hideCatalogHeader =
    pathname === "/" || pathname === "/widgets" || pathname === "/notes";
  const routeItem = pathname.startsWith("/components/")
    ? pathname.split("/").pop()
    : null;
  const requestedItem = searchParams.get("item") ?? routeItem;
  const activeItem =
    requestedItem &&
    (components.some((item) => item.slug === requestedItem) ||
      widgets.some((item) => item.slug === requestedItem))
      ? requestedItem
      : pathname === "/playground"
        ? components[0]?.slug
        : null;

  useEffect(() => {
    if (!hideCatalogHeader) return;
    const timer = window.setTimeout(() => {
      setCollapsed(false);
      setQuery("");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hideCatalogHeader]);

  function routeIsActive(href: string) {
    return href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside
      className={`studio-catalog studio-catalog--global`}
      aria-label="Application navigation and component catalog"
    >
      <div className="studio-catalog-heading">
        <h2>Navigate</h2>
      </div>
      {!collapsed && (
        <>
          <label className="studio-catalog-search">
            <Search size={15} />
            <input
              aria-label="Filter components and widgets"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter components"
              value={query}
            />
          </label>
          <div className="studio-tree-group">
            <h3>
              <ChevronDown size={15} /> Featured
            </h3>
            <Link
              aria-current={routeIsActive("/") ? "page" : undefined}
              className={`studio-tree-link${routeIsActive("/") ? " is-active" : ""}`}
              href="/"
            >
              <Icon name="overview" size={17} /> Overview
            </Link>
            <Link
              aria-current={routeIsActive("/notes") ? "page" : undefined}
              className={`studio-tree-link${routeIsActive("/notes") ? " is-active" : ""}`}
              href="/notes"
            >
              <Icon name="sparkles" size={17} /> What&apos;s New
            </Link>
            <Link
              aria-current={routeIsActive("/docs") ? "page" : undefined}
              className={`studio-tree-link${routeIsActive("/docs") ? " is-active" : ""}`}
              href="/docs"
            >
              <Icon name="book" size={17} /> Getting Started
            </Link>
          </div>
          <div className="studio-tree-group">
            <h3>
              <ChevronDown size={15} /> Workspace
            </h3>
            {workspaceRoutes.map((item) => {
              const active = routeIsActive(item.href);
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`studio-tree-link${active ? " is-active" : ""}`}
                  href={item.href}
                  key={item.href}
                >
                  <Icon name={item.icon} size={17} /> {item.label}
                </Link>
              );
            })}
          </div>
          <div className="studio-tree-group">
            <h3>
              <ChevronDown size={15} /> Core
            </h3>
            {componentItems.map((item) => {
              const active = activeItem === item.slug;
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`studio-tree-link${active ? " is-active" : ""}`}
                  href={item.href}
                  key={item.slug}
                >
                  <Icon name={item.icon} size={17} /> {item.name}
                </Link>
              );
            })}
            {!componentItems.length && (
              <p className="studio-catalog-empty">
                No components match this filter.
              </p>
            )}
          </div>
          <div className="studio-tree-group">
            <h3>
              <ChevronDown size={15} /> Experimental
            </h3>
            {experimentalItems.map((item) => {
              const active = activeItem === item.slug;
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`studio-tree-link${active ? " is-active" : ""}`}
                  href={item.href}
                  key={item.slug}
                >
                  <Icon name={item.icon} size={17} /> {item.name}
                </Link>
              );
            })}
            {!experimentalItems.length && normalized && (
              <p className="studio-catalog-empty">
                No experimental items match this filter.
              </p>
            )}
          </div>
          <div className="studio-catalog-footer">
            <span className="studio-status-dot" /> Widget kit workspace
          </div>
        </>
      )}
    </aside>
  );
}
