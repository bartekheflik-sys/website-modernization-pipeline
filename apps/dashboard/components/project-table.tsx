'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Project } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from 'date-fns'
import { ExternalLink, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo } from 'react'

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
    return <div className="flex h-64 items-center justify-center">Loading projects...</div>
  }

  const getStatusVariant = (status: string): "success" | "destructive" | "secondary" | "warning" | "default" | "outline" => {
    switch (status) {
      case 'completed': return 'success'
      case 'crawled': return 'default'
      case 'analysis_complete': return 'default'
      case 'failed': return 'destructive'
      case 'pending': return 'secondary'
      default: return 'warning'
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search by URL..."
            className="w-full bg-background border rounded-md pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="bg-background border rounded-md px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="crawling">Crawling</option>
          <option value="crawled">Crawled (Ready for Analysis)</option>
          <option value="analyzing">Analyzing</option>
          <option value="analysis_complete">Analysis Complete</option>
          <option value="generating_prompt">Generating Prompt</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Website URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pages</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {project.url}
                    <a href={project.url} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(project.status)}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>{project.pages_count}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/projects/${project.id}`}>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {filteredProjects.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No projects matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
