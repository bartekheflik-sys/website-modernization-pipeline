'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { startCrawl, startAnalysis, generatePrompt } from "@/services/api"
import { Play, RotateCcw, Zap, Wand2, Loader2 } from 'lucide-react'
import { useState } from "react"

interface ControlPanelProps {
  projectId: string;
  onActionStarted: () => void;
  status: string;
}

export function ControlPanel({ projectId, onActionStarted, status }: ControlPanelProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (name: string, fn: (id: string) => Promise<any>) => {
    setLoading(name)
    try {
      await fn(projectId)
      onActionStarted()
    } catch (error) {
      console.error(error)
      alert(`Action ${name} failed`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-medium">Pipeline Controls</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button 
          variant="outline" 
          size="sm"
          disabled={loading === 'crawl' || status === 'crawling'}
          onClick={() => handleAction('crawl', startCrawl)}
        >
          {loading === 'crawl' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
          Start Crawl
        </Button>

        <Button 
          variant="outline" 
          size="sm"
          disabled={loading === 'analyze' || status === 'analyzing'}
          onClick={() => handleAction('analyze', startAnalysis)}
        >
          {loading === 'analyze' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
          Run Analysis
        </Button>

        <Button 
          variant="default" 
          size="sm"
          disabled={loading === 'prompt' || status === 'generating_prompt'}
          onClick={() => handleAction('prompt', generatePrompt)}
        >
          {loading === 'prompt' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
          Generate Prompt
        </Button>

        <div className="h-8 w-[1px] bg-border mx-2" />

        <Button 
          variant="ghost" 
          size="sm"
          className="text-muted-foreground"
          onClick={() => onActionStarted()}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  )
}
