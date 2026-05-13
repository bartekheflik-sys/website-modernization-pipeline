'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PipelineLog } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from 'date-fns'
import { Terminal, Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { cn } from "@/lib/utils"

export default function LogsPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['global-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return data as PipelineLog[]
    }
  })

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Terminal className="h-8 w-8 text-primary" />
          Global System Logs
        </h1>
        <p className="text-muted-foreground mt-1">
          Recent activity across all projects and pipeline steps.
        </p>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Step</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center">Loading logs...</TableCell></TableRow>
            ) : logs?.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {format(new Date(log.created_at), 'HH:mm:ss')}
                </TableCell>
                <TableCell>
                  <Link href={`/projects/${log.project_id}`} className="flex items-center gap-1 text-primary hover:underline">
                    View <ExternalLink className="h-3 w-3" />
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize text-[10px]">{log.step}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      log.status === 'success' ? "bg-emerald-500" : log.status === 'failed' ? "bg-destructive" : "bg-blue-500"
                    )} />
                    <span className="capitalize">{log.status}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-md truncate font-mono text-xs">
                  {log.message}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
