"use client"

import { BrandMark } from "@/components/brand-logo"

export function SystemHeader() {
  return (
    <header className="w-full border-b border-border bg-card px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-white">
          <BrandMark className="h-5" />
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight text-foreground">
            Wheels <span className="text-primary">Experts</span>
          </span>
          <span className="ml-2 text-xs text-muted-foreground">Sales Management System</span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="hidden sm:flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span>Need help? <a href="tel:+918888000000" className="text-primary font-medium hover:underline">+91 88880 00000</a></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <span className="text-success font-medium">Online</span>
        </div>
      </div>
    </header>
  )
}
