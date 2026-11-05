import { DashboardShell } from "@/components/dashboard/shell/dashboard-shell";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "widget-kit — Component workspace",
  description:
    "Personal library of reusable components, widgets, and utilities.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`app-html
        [color-scheme:dark]
        [--background:#090a0e]
        [--surface:#101117]
        [--surface-raised:#14151d]
        [--surface-soft:#171821]
        [--surface-hover:#1c1d28]
        [--foreground:#f2f1f8]
        [--muted:#9293a7]
        [--subtle:#686a7d]
        [--line:#242532]
        [--line-soft:#1d1e29]
        [--purple:#9d5cff]
        [--purple-bright:#ad6cff]
        [--cyan:#31d9d2]
        [--green:#57e0ac]
        [--amber:#f5c66d]
        [--red:#ff788a]
        [min-height:100%]
      `}>
      <body className={`app-body
        [&_*]:[box-sizing:border-box]
        [min-height:100%]
        [&_*]:[scrollbar-width:none]
        [&_*::-webkit-scrollbar]:[display:none]
        [&_*::-webkit-scrollbar]:[width:0]
        [&_*::-webkit-scrollbar]:[height:0]
        [margin:0]
        [background:var(--background)]
        [color:var(--foreground)]
        [font-family:Inter,_ui-sans-serif,_system-ui,_-apple-system,_BlinkMacSystemFont,_"Segoe_UI",_sans-serif]
        [font-size:14px]
        [line-height:1.5]
        [-webkit-font-smoothing:antialiased]
        [&_button]:[font:inherit]
        [&_input]:[font:inherit]
        [&_textarea]:[font:inherit]
        [&_select]:[font:inherit]
        [&_button]:[-webkit-tap-highlight-color:transparent]
        [&_a]:[-webkit-tap-highlight-color:transparent]
        [&_select]:[-webkit-tap-highlight-color:transparent]
        [&_button]:[color:inherit]
        [&_a]:[color:inherit]
        [&_a]:[text-decoration:none]
        [&_button:focus-visible]:[outline:2px_solid_var(--purple-bright)]
        [&_button:focus-visible]:[outline-offset:3px]
        [&_a:focus-visible]:[outline:2px_solid_var(--purple-bright)]
        [&_a:focus-visible]:[outline-offset:3px]
        [&_input:focus-visible]:[outline:none]
        [&_input:focus-visible]:[border-color:#9865d2]
        [&_input:focus-visible]:[box-shadow:none]
        [&_select:focus-visible]:[outline:none]
        [&_select:focus-visible]:[border-color:#9865d2]
        [&_select:focus-visible]:[box-shadow:none]
        [&_textarea:focus-visible]:[outline:none]
        [&_textarea:focus-visible]:[border-color:#9865d2]
        [&_textarea:focus-visible]:[box-shadow:none]
        [&::selection]:[color:white]
        [&::selection]:[background:#753ad1]
        [&_kbd]:[padding:2px_7px]
        [&_kbd]:[border:1px_solid_#30313e]
        [&_kbd]:[border-radius:5px]
        [&_kbd]:[color:#a3a4b5]
        [&_kbd]:[background:#181923]
        [&_kbd]:[font:11px_ui-monospace,_SFMono-Regular,_Menlo,_monospace]
      `}>
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
