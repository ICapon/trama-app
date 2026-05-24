"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/ui/theme-toggle"

function NetworkIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="3" />
      <circle cx="19" cy="19" r="3" />
      <circle cx="5" cy="19" r="3" />
      <path d="M12 8v4M8.5 17 12 12l3.5 5" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  active: boolean
}

function NavItem({ href, icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const isHome = pathname === "/" || pathname.startsWith("/investigations")

  return (
    <aside className="flex w-56 flex-shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-[15px] border-b border-zinc-200 dark:border-zinc-800">
        <span className="text-zinc-700 dark:text-zinc-300">
          <NetworkIcon />
        </span>
        <span className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 text-sm">
          TRAMA
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-2 flex-1">
        <p className="px-3 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
          Main
        </p>
        <NavItem
          href="/"
          icon={<FolderIcon />}
          label="Investigations"
          active={isHome}
        />
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 px-3 py-2.5 flex items-center justify-between">
        <span className="text-[11px] text-zinc-400 font-mono">v0.1.0</span>
        <ThemeToggle />
      </div>
    </aside>
  )
}
