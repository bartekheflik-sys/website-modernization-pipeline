'use client'

import { PipelineLog, PipelineError } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from 'date-fns'
import { Terminal, AlertTriangle, Clock } from 'lucide-react'

export function PipelineLogs({ logs }: { logs: PipelineLog[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-muted-foreground" />
          <CardTitle>System Logs</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[400px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No logs available</div>
          ) : (
            <div className="divide-y border-t">
              {logs.map((log) => (
                <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-muted/30 transition-colors">
                  <div className="pt-1">
                    {log.status === 'success' ? (
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    ) : log.status === 'failed' ? (
                      <div className="h-2 w-2 rounded-full bg-destructive" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-muted-foreground tracking-tight">
                        {log.step}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(log.created_at), 'HH:mm:ss')}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{log.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function ErrorPanel({ errors }: { errors: PipelineError[] }) {
  if (errors.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-5 w-5" />
        <h3 className="font-bold">Pipeline Failures ({errors.length})</h3>
      </div>
      <div className="space-y-3">
        {errors.map((err) => (
          <Card key={err.id} className="border-destructive/30 bg-destructive/5 overflow-hidden">
            <div className="bg-destructive/10 px-4 py-2 flex items-center justify-between border-b border-destructive/20">
              <span className="text-[10px] font-bold uppercase tracking-widest text-destructive">
                Source: {err.source}
              </span>
              <span className="text-[10px] text-destructive/70">
                {format(new Date(err.created_at), 'MMM d, HH:mm:ss')}
              </span>
            </div>
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-destructive">{err.error_message}</p>
              {err.retry_count > 0 && (
                <p className="text-xs text-destructive/60 mt-2">
                  Auto-retried {err.retry_count} times.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
