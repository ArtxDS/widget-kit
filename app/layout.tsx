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
        scheme-dark
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
        min-h-full
      `}>
      <body className={`app-body
        **:box-border
        min-h-full
        **:scrollbar-none
        [&_*::-webkit-scrollbar]:hidden
        [&_*::-webkit-scrollbar]:size-0
        
        m-0
        [background:var(--background)]
        text-(--foreground)
        font-[Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe_UI",sans-serif]
        text-[14px]
        leading-normal
        [-webkit-font-smoothing:antialiased]
        [&_button]:[font:inherit]
        [&_input]:[font:inherit]
        [&_textarea]:[font:inherit]
        [&_select]:[font:inherit]
        [&_button]:[-webkit-tap-highlight-color:transparent]
        [&_a]:[-webkit-tap-highlight-color:transparent]
        [&_select]:[-webkit-tap-highlight-color:transparent]
        [&_button]:text-inherit
        [&_a]:text-inherit
        [&_a]:[text-decoration:none]
        [&_button:focus-visible]:[outline:2px_solid_var(--purple-bright)]
        [&_button:focus-visible]:outline-offset-[3px]
        [&_a:focus-visible]:[outline:2px_solid_var(--purple-bright)]
        [&_a:focus-visible]:outline-offset-[3px]
        [&_input:focus-visible]:[outline:none]
        [&_input:focus-visible]:border-[#9865d2]
        [&_input:focus-visible]:[box-shadow:none]
        [&_select:focus-visible]:[outline:none]
        [&_select:focus-visible]:border-[#9865d2]
        [&_select:focus-visible]:[box-shadow:none]
        [&_textarea:focus-visible]:[outline:none]
        [&_textarea:focus-visible]:border-[#9865d2]
        [&_textarea:focus-visible]:[box-shadow:none]
        [&::selection]:text-[white]
        [&::selection]:[background:#753ad1]
        [&_kbd]:p-[2px_7px]
        [&_kbd]:[border:1px_solid_#30313e]
        [&_kbd]:rounded-[5px]
        [&_kbd]:text-[#a3a4b5]
        [&_kbd]:[background:#181923]
        [&_kbd]:[font:11px_ui-monospace,SFMono-Regular,Menlo,monospace]
      `}>
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
