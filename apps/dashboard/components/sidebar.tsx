import Link from "next/link"
import { LayoutDashboard, Globe, Settings, Terminal, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

const sidebarItems = [
  { name: "Projects", icon: Globe, href: "/" },
  { name: "Logs", icon: Terminal, href: "/logs" },
  { name: "Errors", icon: AlertTriangle, href: "/errors" },
  { name: "Settings", icon: Settings, href: "/settings" },
]

export function Sidebar() {
  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card text-card-foreground">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Terminal className="h-6 w-6 text-primary" />
          <span>AG-Modernizer</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-6">
        {sidebarItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="border-t p-4 text-xs text-muted-foreground text-center">
        v1.0.0-beta
      </div>
    </div>
  )
}
