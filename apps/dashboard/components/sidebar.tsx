import Link from "next/link"
import { Globe, Settings, Terminal, AlertTriangle, Layers } from "lucide-react"
import { cn } from "@/lib/utils"

const sidebarItems = [
  { name: "Projects", icon: Globe, href: "/" },
  { name: "Logs", icon: Terminal, href: "/logs" },
  { name: "Errors", icon: AlertTriangle, href: "/errors" },
  { name: "Settings", icon: Settings, href: "/settings" },
]

export function Sidebar() {
  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card/30 backdrop-blur-xl text-card-foreground">
      <div className="flex h-20 items-center px-6">
        <Link href="/" className="flex items-center gap-3 font-bold text-xl tracking-tight">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl premium-gradient text-white shadow-lg shadow-primary/20">
            <Layers className="h-6 w-6" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-foreground">AG</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Modernizer</span>
          </div>
        </Link>
      </div>
      <nav className="flex-1 space-y-2 px-4 py-8">
        {sidebarItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
              "hover:bg-primary/10 hover:text-primary hover:translate-x-1"
            )}
          >
            <item.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="p-6">
        <div className="rounded-2xl bg-muted/50 p-4 text-center border border-white/5">
          <p className="text-[10px] uppercase tracking-tighter text-muted-foreground font-bold">System Status</p>
          <p className="mt-1 text-xs font-medium text-emerald-500 flex items-center justify-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Operational
          </p>
        </div>
        <div className="mt-4 text-[10px] text-muted-foreground/60 text-center font-medium italic">
          v1.0.0-beta
        </div>
      </div>
    </div>
  )
}
