'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { Project, PipelineLog, PipelineError, AnalysisResult, GeneratedPrompt, StepStatus } from '../../../types'
import { PipelineStatus } from '../../../components/pipeline-status'
import { ControlPanel } from '../../../components/control-panel'
import { PromptViewer } from '../../../components/prompt-viewer'
import { AnalysisViewer } from '../../../components/analysis-viewer'
import { PipelineLogs, ErrorPanel } from '../../../components/observability'
import { Button } from '../../../components/ui/button'
import { ChevronLeft, Globe, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { QAComparison } from '../../../components/qa-comparison'
import { AssetGallery } from '../../../components/asset-gallery'

export default function ProjectDetailPage() {
  const params = useParams()
  const id = params.id as string

  // 1. Fetch Project Core Data
  const { data: project, refetch: refetchProject } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*').eq('id', id).single()
      if (error) throw error
      return data as Project
    }
  })

  // 2. Fetch Pipeline Logs
  const { data: logs, refetch: refetchLogs } = useQuery({
    queryKey: ['logs', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('pipeline_logs').select('*').eq('project_id', id).order('created_at', { ascending: false })
      if (error) throw error
      return data as PipelineLog[]
    }
  })

  // 3. Fetch Pipeline Errors
  const { data: errors, refetch: refetchErrors } = useQuery({
    queryKey: ['errors', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('pipeline_errors').select('*').eq('project_id', id).order('created_at', { ascending: false })
      if (error) throw error
      return data as PipelineError[]
    }
  })

  // 4. Fetch AI Analysis
  const { data: analysis, refetch: refetchAnalysis } = useQuery({
    queryKey: ['analysis', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('analysis_results').select('*').eq('project_id', id).order('created_at', { ascending: false }).limit(1).single()
      if (error && error.code !== 'PGRST116') throw error
      return data as AnalysisResult
    }
  })

  // 5. Fetch Generated Prompt
  const { data: prompt, refetch: refetchPrompt } = useQuery({
    queryKey: ['prompt', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('generated_prompts').select('*').eq('project_id', id).order('created_at', { ascending: false }).limit(1).single()
      if (error && error.code !== 'PGRST116') throw error
      return data as GeneratedPrompt
    }
  })

  // 6. Fetch QA Report (Step 6)
  const { data: qaReport, refetch: refetchQA } = useQuery({
    queryKey: ['qa-report', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('website_qa_reports').select('*').eq('project_id', id).order('created_at', { ascending: false }).limit(1).single()
      if (error && error.code !== 'PGRST116') throw error
      return data
    }
  })

  const refreshAll = () => {
    refetchProject()
    refetchLogs()
    refetchErrors()
    refetchAnalysis()
    refetchPrompt()
    refetchQA()
  }

  // Derive step statuses from project status and logs
  const getStepStatus = (step: 'crawl' | 'asset_intel' | 'analysis' | 'prompt'): StepStatus => {
    if (!project) return 'idle'
    
    // Status mappings
    if (step === 'crawl') {
      if (project.status === 'crawling') return 'running'
      if (['analyzing_assets', 'analyzing', 'generating_prompt', 'completed'].includes(project.status)) return 'success'
      if (project.status === 'failed' && logs?.[0]?.step === 'crawl') return 'failed'
    }

    if (step === 'asset_intel') {
      if (project.status === 'analyzing_assets') return 'running'
      if (['analyzing', 'generating_prompt', 'completed'].includes(project.status)) return 'success'
      if (project.status === 'failed' && logs?.[0]?.step === 'asset_intelligence') return 'failed'
    }
    
    if (step === 'analysis') {
      if (project.status === 'analyzing') return 'running'
      if (['generating_prompt', 'completed'].includes(project.status)) return 'success'
      if (project.status === 'failed' && logs?.[0]?.step === 'analysis') return 'failed'
    }

    if (step === 'prompt') {
      if (project.status === 'generating_prompt') return 'running'
      if (project.status === 'completed') return 'success'
      if (project.status === 'failed' && logs?.[0]?.step === 'prompt_generation') return 'failed'
    }

    return 'idle'
  }

  const pipelineSteps = [
    { name: 'crawl', label: 'Crawling', status: getStepStatus('crawl') },
    { name: 'asset_intel', label: 'Asset Intelligence', status: getStepStatus('asset_intel') },
    { name: 'analysis', label: 'AI Analysis', status: getStepStatus('analysis') },
    { name: 'prompt', label: 'Prompt Gen', status: getStepStatus('prompt') },
  ]

  if (!project) return <div className="p-8">Loading project details...</div>

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.url}</h1>
            <a href={project.url} target="_blank" rel="noreferrer" className="mt-1 p-1 rounded-full hover:bg-muted">
              <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
            </a>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            ID: <span className="font-mono text-[10px]">{project.id}</span>
          </div>
        </div>
        <ControlPanel projectId={id} onActionStarted={refreshAll} status={project.status} />
      </div>

      {/* Status Bar */}
      <PipelineStatus steps={pipelineSteps} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (Left 2/3) */}
        <div className="lg:col-span-2 space-y-8">
          <PromptViewer prompt={prompt || null} />
          <AssetGallery projectId={id} />
          <QAComparison projectId={id} modernizedUrl={project.modernized_url} />
          <AnalysisViewer analysis={analysis || null} />
        </div>

        {/* Sidebar (Right 1/3) */}
        <div className="space-y-8">
          <ErrorPanel errors={errors || []} />
          <PipelineLogs logs={logs || []} />
        </div>
      </div>
    </div>
  )
}
