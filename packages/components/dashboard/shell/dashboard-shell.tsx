"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/auth/client";
import { useCurrentUser } from "@/components/dashboard/auth/use-current-user";
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
  const router = useRouter();
  const isOverview = pathname === "/";
  const isNotes = pathname === "/notes";
  const isStudio = pathname === "/playground" || pathname.startsWith("/components/");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [version, setVersion] = useState("0.1.1");
  const { user: currentUser, loading: userLoading } = useCurrentUser();
  const avatarUrl = currentUser?.avatarUrl ?? null;
  const userLabel = currentUser?.name ?? currentUser?.email ?? null;
  const role = currentUser?.role ?? "Usuário";
  const [provider, setProvider] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    let active = true;
    async function loadVersion() {
      const urls = [
        "https://registry.npmjs.org/@artxds/widget-kit/latest",
        "https://registry.npmjs.org/@artxds/widget-kit",
      ];
      for (const url of urls) {
        try {
          const response = await fetch(url, { cache: "no-store" });
          if (!response.ok) continue;
          const data = (await response.json()) as {
            version?: string;
            latest?: string;
            "dist-tags"?: { latest?: string };
          };
          const next =
            data.version ?? data["dist-tags"]?.latest ?? data.latest;
          if (typeof next === "string" && active) {
            setVersion(next);
            return;
          }
        } catch {}
      }
    }
    void loadVersion();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    try {
      const supabase = createSupabaseBrowserClient();

      const loadUser = async () => {
        const { data } = await supabase.auth.getUser();
        if (!active) return;
        const user = data.user;
        const appMetadata = (user?.app_metadata ?? {}) as {
          provider?: string;
        };
        setProvider(
          appMetadata.provider ??
            user?.identities?.[0]?.provider ??
            null,
        );
      };

      void loadUser();
      const { data: listener } = supabase.auth.onAuthStateChange(() => {
        void loadUser();
      });
      unsubscribe = () => listener.subscription.unsubscribe();
    } catch {
      // Auth is not configured in this environment.
    }

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [profileOpen]);

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

  async function handleSignOut() {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // Auth is not configured in this environment.
    }
    router.push("/");
  }

  return (
    <QualityProvider>
      <div className="dashboard-frame">
        <header className="global-header">
          <Link className="global-brand" href="/" aria-label="widget-kit overview">
            <span className="global-brand-mark" aria-hidden="true"><Blocks size={27} strokeWidth={1.9} /></span>
            <strong>widget-kit</strong>
            <small>v{version}</small>
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
          {userLoading ? (
            <div className="size-9 rounded-full bg-[#1E222B] animate-pulse border border-[#232730]" aria-hidden="true" />
          ) : currentUser ? (
            <div className="relative" ref={profileRef}>
              <button
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                className="global-profile overflow-hidden p-0"
                onClick={() => setProfileOpen((current) => !current)}
                type="button"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={userLabel ?? "User avatar"}
                    className="size-full"
                    src={avatarUrl}
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <span className="size-full grid place-items-center text-[12px] font-semibold text-[#cfd0de]">
                    {(userLabel ?? "U").charAt(0).toUpperCase()}
                  </span>
                )}
              </button>
              {profileOpen && (
                <div
                  className={`absolute right-0 top-[calc(100%+6px)] z-60 min-w-[220px] rounded-[10px] border border-[#414248] bg-[#202125] p-[6px] shadow-[0_14px_38px_#0009]`}
                  role="menu"
                >
                  <div className="flex items-center gap-[10px] px-[10px] py-[8px]">
                    {provider === "google" ? (
                      <svg
                        aria-hidden="true"
                        height="18"
                        viewBox="0 0 24 24"
                        width="18"
                      >
                        <path d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z" fill="#4285F4" />
                        <path d="M12 22c2.7 0 4.96-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.62A10 10 0 0 0 12 22Z" fill="#34A853" />
                        <path d="M6.41 13.94A6 6 0 0 1 6.1 12c0-.67.11-1.32.31-1.94V7.44H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.56l3.35-2.62Z" fill="#FBBC05" />
                        <path d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.94 5.44l3.35 2.62C7.2 7.7 9.4 5.94 12 5.94Z" fill="#EA4335" />
                      </svg>
                    ) : (
                      <span className="global-profile" style={{ width: 18, height: 18, fontSize: 9 }}>
                        {provider ? provider.charAt(0).toUpperCase() : "U"}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-[8px]">
                        <strong className="truncate text-[13px] text-[#f2f1f8]">
                          {userLabel ?? "Usuário"}
                        </strong>
                        {role && (
                          <span className="shrink-0 rounded-[999px] border border-[#3a3b42] bg-[#2a2b31] p-[2px_8px] text-[10.5px] text-[#c7c8d4]">
                            {role}
                          </span>
                        )}
                      </div>
                      {provider && (
                        <span className="block truncate text-[11.5px] text-[#9293a7]">
                          {provider.charAt(0).toUpperCase() + provider.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="my-[4px] h-px bg-[#2c2d33]" />
                  <button
                    className="flex w-full items-center gap-[8px] rounded-[8px] px-[10px] py-[8px] text-left text-[12.5px] text-[#dad9e7] transition hover:bg-[#2b2c30]"
                    onClick={() => void handleSignOut()}
                    role="menuitem"
                    type="button"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </header>

        <div className="dashboard-body">
          <Suspense fallback={<CatalogSidebarFallback pathname={pathname} />}>
            <CatalogSidebar pathname={pathname} />
          </Suspense>
          {isStudio ? (
            <div className="main-content main-content--studio">{children}</div>
          ) : (
            <main
              className={`main-content${isOverview ? " main-content--overview" : ""}${isNotes ? " main-content--notes" : ""}`}
            >
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
