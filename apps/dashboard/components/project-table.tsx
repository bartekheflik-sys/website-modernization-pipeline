'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Project } from '../types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { formatDistanceToNow } from 'date-fns'
import { ExternalLink, Search, Filter, MoreHorizontal, ChevronRight, Layout } from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'

export function ProjectTable() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          pages(count)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data.map(p => ({
        ...p,
        pages_count: p.pages?.[0]?.count || 0
      })) as Project[]
    }
  })

  const filteredProjects = useMemo(() => {
    if (!projects) return []
    return projects.filter(p => {
      const matchesSearch = p.url.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [projects, searchTerm, statusFilter])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 rounded-3xl border border-white/5 bg-card/30 backdrop-blur-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Syncing Pipelines...</p>
      </div>
    )
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': return { variant: 'success', label: 'Completed', color: 'text-emerald-500 bg-emerald-500/10' }
      case 'approved': return { variant: 'success', label: 'Approved', color: 'text-emerald-500 bg-emerald-500/10' }
      case 'crawling': return { variant: 'warning', label: 'Crawling', color: 'text-amber-500 bg-amber-500/10' }
      case 'analyzing': return { variant: 'warning', label: 'Analyzing', color: 'text-blue-500 bg-blue-500/10' }
      case 'failed': return { variant: 'destructive', label: 'Failed', color: 'text-rose-500 bg-rose-500/10' }
      case 'pending': return { variant: 'secondary', label: 'Pending', color: 'text-slate-500 bg-slate-500/10' }
      default: return { variant: 'default', label: status.replace('_', ' '), color: 'text-primary bg-primary/10' }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            placeholder="Search pipelines by URL..."
            className="w-full bg-card/50 border-white/5 rounded-2xl pl-11 pr-4 py-3 text-sm outline-none focus:ring-4 focus:ring-primary/10 border group-focus-within:border-primary/50 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <select
              className="w-full md:w-48 appearance-none bg-card/50 border-white/5 border rounded-xl pl-9 pr-8 py-2 text-xs font-bold uppercase tracking-wider outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All States</option>
              <option value="pending">Pending</option>
              <option value="crawling">Crawling</option>
              <option value="analyzing">Analyzing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/5 bg-card/30 backdrop-blur-xl overflow-hidden shadow-2xl">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-white/5">
              <TableHead className="text-[10px] font-bold uppercase tracking-widest h-14">Project Instance</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest h-14 text-center">Status</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest h-14 text-center">Nodes</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest h-14">Deployment</TableHead>
              <TableHead className="text-right pr-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.map((project) => {
              const status = getStatusConfig(project.status)
              return (
                <TableRow key={project.id} className="group border-white/5 hover:bg-white/[0.02] transition-colors">
                  <TableCell className="py-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary border border-primary/10">
                        <Layout className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm tracking-tight">{new URL(project.url).hostname}</span>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium group-hover:text-primary transition-colors">
                          <span className="max-w-[200px] truncate">{project.url}</span>
                          <a href={project.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border border-white/5",
                      status.color
                    )}>
                      <div className={cn("h-1.5 w-1.5 rounded-full", project.status === 'analyzing' || project.status === 'crawling' ? 'animate-pulse bg-current' : 'bg-current')} />
                      {status.label}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm font-bold tabular-nums text-muted-foreground group-hover:text-foreground transition-colors">
                      {project.pages_count}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">{formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">{new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <Link href={`/projects/${project.id}`}>
                      <Button variant="ghost" size="sm" className="rounded-xl hover:bg-primary hover:text-primary-foreground group-hover:translate-x-1 transition-all font-bold text-xs uppercase tracking-widest gap-2">
                        Details
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
            {filteredProjects.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 opacity-40">
                    <Search className="h-8 w-8" />
                    <p className="text-sm font-bold uppercase tracking-widest">No matching pipelines found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
