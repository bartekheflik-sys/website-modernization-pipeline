'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AnalysisResult } from '@/types'
import { Brain, Target, Compass, MousePointer2, ListChecks } from 'lucide-react'

export function AnalysisViewer({ analysis }: { analysis: AnalysisResult | null }) {
  if (!analysis) {
    return (
      <Card className="flex h-48 flex-col items-center justify-center text-center p-8 bg-muted/20 border-dashed">
        <Brain className="h-10 w-10 text-muted-foreground/30 mb-2" />
        <CardTitle className="text-muted-foreground text-sm">No Analysis Yet</CardTitle>
      </Card>
    )
  }

  const data = analysis.analysis_json

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <CardTitle>Business Intelligence</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="text-xs font-bold uppercase text-muted-foreground">Business Summary</span>
            <p className="mt-1 text-sm leading-relaxed">{data.business_summary}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-bold uppercase text-muted-foreground">Industry</span>
              <p className="mt-1 text-sm">{data.industry}</p>
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-muted-foreground">Target Audience</span>
              <p className="mt-1 text-sm">{data.target_audience}</p>
            </div>
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-muted-foreground">Value Proposition</span>
            <p className="mt-1 text-sm italic">"{data.value_proposition}"</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-blue-500" />
              <CardTitle>Design Direction</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase text-muted-foreground">Style</span>
              <p className="mt-1 text-sm">{data.design_direction.ui_direction}</p>
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-muted-foreground">Color Palette</span>
              <p className="mt-1 text-sm">{data.design_direction.color_direction}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-muted-foreground">Motion Level:</span>
              <Badge variant="outline" className="capitalize">{data.design_direction.motion_level}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MousePointer2 className="h-5 w-5 text-emerald-500" />
              <CardTitle>UX Strategy</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-muted-foreground">Conversion Score:</span>
              <Badge variant={data.ux_analysis.conversion_score > 7 ? 'success' : 'warning'}>
                {data.ux_analysis.conversion_score}/10
              </Badge>
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-muted-foreground">Missing Elements</span>
              <ul className="mt-1 text-sm list-disc list-inside space-y-1">
                {data.ux_analysis.missing_elements.map((el: string, i: number) => (
                  <li key={i}>{el}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
