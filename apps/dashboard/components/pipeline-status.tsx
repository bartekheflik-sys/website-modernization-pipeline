'use client'

import { StepStatus } from '@/types'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PipelineStep {
  name: string;
  status: StepStatus;
  label: string;
}

export function PipelineStatus({ steps }: { steps: PipelineStep[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {steps.map((step, idx) => (
        <div 
          key={step.name}
          className={cn(
            "relative p-4 rounded-xl border bg-card flex flex-col gap-3 transition-all",
            step.status === 'running' && "ring-2 ring-primary ring-offset-2 dark:ring-offset-background",
            step.status === 'failed' && "border-destructive/50 bg-destructive/5"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Step {idx + 1}
            </span>
            {step.status === 'running' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            {step.status === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            {step.status === 'failed' && <AlertCircle className="h-4 w-4 text-destructive" />}
            {step.status === 'idle' && <Circle className="h-4 w-4 text-muted-foreground" />}
          </div>
          
          <div>
            <h3 className="font-semibold text-lg">{step.label}</h3>
            <div className="mt-1">
              <Badge 
                variant={
                  step.status === 'success' ? 'success' : 
                  step.status === 'failed' ? 'destructive' : 
                  step.status === 'running' ? 'default' : 'outline'
                }
                className="capitalize"
              >
                {step.status}
              </Badge>
            </div>
          </div>

          {idx < steps.length - 1 && (
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center border text-[10px] font-bold">
                →
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
