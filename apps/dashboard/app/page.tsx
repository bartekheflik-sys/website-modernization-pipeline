'use client'

import { ProjectTable } from "@/components/project-table"
import { CreateProjectForm } from "@/components/create-project-form"
import { Sparkles, Activity } from "lucide-react"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"

export default function DashboardHome() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto space-y-24 py-12 px-4 md:px-8">
      <motion.header 
        style={{ y, opacity }}
        initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between relative z-10"
      >
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="flex items-center gap-3 text-primary"
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-[0.25em]">Intelligence Engine</span>
          </motion.div>
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-br from-foreground via-foreground/90 to-foreground/40 bg-clip-text text-transparent pb-2">
            Project Command
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl font-medium leading-relaxed">
            Deploy and manage high-fidelity website modernization pipelines with AI-driven extraction.
          </p>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          whileHover={{ scale: 1.02, y: -4 }}
          className="flex items-center gap-8 px-8 py-4 rounded-3xl glass-card border-white/10"
        >
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase text-muted-foreground tracking-[0.2em]">Active Threads</span>
            <span className="text-3xl font-bold tabular-nums flex items-center gap-3">
              <Activity className="h-5 w-5 text-emerald-500 animate-pulse" />
              12
            </span>
          </div>
          <div className="w-px h-12 bg-border/50" />
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase text-muted-foreground tracking-[0.2em]">Success Rate</span>
            <span className="text-3xl font-bold tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
              98.4%
            </span>
          </div>
        </motion.div>
      </motion.header>

      <motion.section 
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-[2.5rem] glass-card p-10 md:p-14 border-white/5 relative overflow-hidden group hover:border-primary/20 transition-colors duration-700"
      >
        <div className="absolute top-0 right-0 -mt-32 -mr-32 h-96 w-96 rounded-full bg-primary/10 blur-[120px] group-hover:bg-primary/20 group-hover:scale-150 transition-all duration-1000 ease-out" />
        <div className="absolute bottom-0 left-0 -mb-32 -ml-32 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px] group-hover:bg-blue-500/20 group-hover:scale-150 transition-all duration-1000 ease-out" />
        <div className="relative z-10">
          <CreateProjectForm />
        </div>
      </motion.section>

      <motion.section 
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-8"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <h2 className="text-3xl font-bold tracking-tight">Active Modernization Pipelines</h2>
          <div className="flex items-center gap-3 px-4 py-2 rounded-full glass bg-white/5">
            <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_12px_rgba(139,92,246,0.8)]" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Real-time Sync</span>
          </div>
        </div>
        <ProjectTable />
      </motion.section>
    </div>
  )
}

