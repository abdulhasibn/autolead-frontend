import { SystemHeader } from "./_components/system-header"

const FEATURES = [
  {
    title: "Track Every Lead",
    description: "From first inquiry to final handshake — never let a prospect slip through.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "Book Test Drives",
    description: "Schedule, confirm and follow up on test drive appointments in seconds.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Manage Inventory",
    description: "Live stock of every vehicle — specs, pricing, availability at a glance.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m-1 9H8m0 0a2 2 0 100 4 2 2 0 000-4zm9 0a2 2 0 100 4 2 2 0 000-4zm-5-9h8l2 6H11l1-6z" />
      </svg>
    ),
  },
  {
    title: "Close More Deals",
    description: "Smart follow-up reminders and pipeline views that keep sales moving.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-muted">
      <SystemHeader />

      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-[1200px] min-h-[680px] bg-card rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">

          {/* Left: Brand panel */}
          <section
            className="lg:col-span-7 relative flex flex-col justify-between p-8 lg:p-12 overflow-hidden"
            style={{ background: "linear-gradient(150deg, #0F2027 0%, #1a3a4a 55%, #0D9488 100%)" }}
          >
            {/* Glow blobs */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4" />
            </div>

            {/* Faint car silhouette */}
            <div className="absolute bottom-24 right-0 opacity-[0.04] pointer-events-none translate-x-8">
              <svg viewBox="0 0 500 200" className="w-[440px]" fill="white">
                <path d="M460,120 C460,110 452,105 440,105 L430,105 L420,75 C415,62 400,55 370,55 L170,55 C145,55 130,62 120,75 L95,105 L70,105 C55,105 45,110 45,120 L45,140 C45,148 52,155 60,155 L80,155 C82,165 91,173 102,173 C113,173 122,165 124,155 L370,155 C372,165 381,173 392,173 C403,173 412,165 414,155 L440,155 C448,155 460,150 460,140 Z M150,80 L280,80 L295,105 L130,105 Z M300,80 L360,80 L375,105 L315,105 Z" />
              </svg>
            </div>

            <div className="relative z-10 flex flex-col gap-10">
              {/* Logo + badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-card/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="3" />
                      <line x1="12" y1="2" x2="12" y2="9" />
                      <line x1="4.22" y1="6.22" x2="9.17" y2="9.17" />
                      <line x1="19.78" y1="6.22" x2="14.83" y2="9.17" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xl font-bold tracking-tight text-white">
                      Wheels <span className="text-[#34D399]">Experts</span>
                    </span>
                    <span className="block text-[11px] font-medium text-white/50 uppercase tracking-wider">
                      Sales Management
                    </span>
                  </div>
                </div>
                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/10 backdrop-blur-sm border border-white/20 text-xs font-medium text-white/70">
                  <svg className="w-3 h-3 text-[#34D399]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                  </svg>
                  Staff Portal
                </div>
              </div>

              {/* Headline */}
              <div>
                <h1 className="text-3xl lg:text-[2.6rem] font-bold text-white leading-[1.15] mb-4">
                  Every sale starts<br />
                  <span className="text-[#34D399]">with the right lead.</span>
                </h1>
                <p className="text-[15px] leading-relaxed text-white/60 max-w-md">
                  The complete sales toolkit for Wheels Experts staff — manage inquiries, schedule test drives, and track your pipeline from one place.
                </p>
              </div>

              {/* Feature list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FEATURES.map((f) => (
                  <div
                    key={f.title}
                    className="flex items-start gap-3 rounded-xl p-4 bg-card/8 border border-white/10 hover:bg-card/12 transition-colors"
                    style={{ background: "rgba(255,255,255,0.07)" }}
                  >
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-[#34D399]/15 border border-[#34D399]/20 flex items-center justify-center text-[#34D399]">
                      {f.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white mb-0.5">{f.title}</p>
                      <p className="text-[12px] leading-relaxed text-white/50">{f.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 pt-5 mt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-white/40">
              <span>For authorised <strong className="text-white/60">showroom staff</strong> only</span>
              <span>© 2026 Wheels Experts</span>
            </div>
          </section>

          {/* Right: Form slot */}
          <section className="lg:col-span-5 bg-card p-8 sm:p-12 flex flex-col justify-between items-center">
            <div className="flex-1 flex items-center justify-center w-full">
              <div className="w-full max-w-[400px]">
                {children}
              </div>
            </div>

            <div className="w-full max-w-[400px] pt-5 border-t border-border/50 flex items-center justify-between text-xs text-subtle-foreground mt-8">
              <span>© 2026 Wheels Experts</span>
              <div className="flex items-center gap-3">
                <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                <span>·</span>
                <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}
