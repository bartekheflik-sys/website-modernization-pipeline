import { ProjectTable } from "@/components/project-table"
import { CreateProjectForm } from "@/components/create-project-form"
import { Sparkles, Activity } from "lucide-react"

export default function DashboardHome() {
  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Intelligence Engine</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            Project Command
          </h1>
          <p className="text-muted-foreground mt-2 max-w-md font-medium">
            Deploy and manage high-fidelity website modernization pipelines with AI-driven extraction.
          </p>
        </div>
        
        <div className="flex items-center gap-6 px-6 py-3 rounded-2xl glass-card border-white/10">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Active Threads</span>
            <span className="text-2xl font-bold tabular-nums flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
              12
            </span>
          </div>
          <div className="w-px h-8 bg-border/50" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Success Rate</span>
            <span className="text-2xl font-bold tabular-nums">98.4%</span>
          </div>
        </div>
      </header>

      <section className="rounded-3xl glass-card p-8 border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-primary/10 blur-[100px] group-hover:bg-primary/20 transition-colors duration-700" />
        <CreateProjectForm />
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Active Modernization Pipelines</h2>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Real-time Sync</span>
          </div>
        </div>
        <ProjectTable />
      </section>
    </div>
  )
}
