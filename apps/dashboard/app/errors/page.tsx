'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PipelineError } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from 'date-fns'
import { AlertTriangle, Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function ErrorsPage() {
  const { data: errors, isLoading } = useQuery({
    queryKey: ['global-errors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_errors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data as PipelineError[]
    }
  })

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-8 w-8" />
          Pipeline Failures
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor and debug system-wide errors and validation failures.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="text-center p-12">Loading failures...</div>
        ) : errors?.map((err) => (
          <Card key={err.id} className="border-destructive/20 bg-destructive/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="uppercase text-[10px]">{err.source}</Badge>
                  <CardTitle className="text-sm font-mono">{err.project_id}</CardTitle>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(err.created_at), 'MMM d, HH:mm:ss')}
                  </span>
                  <Link href={`/projects/${err.project_id}`}>
                    <ExternalLink className="h-4 w-4 text-primary hover:text-primary/80" />
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-destructive leading-relaxed">
                {err.error_message}
              </p>
              {err.retry_count > 0 && (
                <div className="mt-2 text-xs text-destructive/60">
                  Retry attempt #{err.retry_count}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {errors?.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground border-dashed">
            No pipeline failures detected. System is running smoothly.
          </Card>
        )}
      </div>
    </div>
  )
}
