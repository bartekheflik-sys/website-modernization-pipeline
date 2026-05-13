'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Globe, Search, AlertCircle, CheckCircle, ExternalLink, ArrowUpRight } from 'lucide-react'

interface QAComparisonProps {
  projectId: string;
  modernizedUrl?: string;
}

export function QAComparison({ projectId, modernizedUrl: initialUrl }: QAComparisonProps) {
  const [url, setUrl] = useState(initialUrl || '')
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<any>(null)

  const startQACrawl = async () => {
    setLoading(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const res = await fetch(`${API_URL}/api/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, url, isModernized: true })
      })
      if (!res.ok) throw new Error('Failed to start QA crawl')
      alert('QA Crawl Started! Check logs for progress.')
    } catch (err) {
      alert('Error starting QA crawl')
    } finally {
      setLoading(false)
    }
  }

  const runAnalysis = async () => {
    setLoading(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const res = await fetch(`${API_URL}/api/qa/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to run QA analysis')
      }
      
      setReport(data.qa_report_json)
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                QA & Verification Engine
              </CardTitle>
              <CardDescription>
                Compare the original site against your Lovable modernization.
              </CardDescription>
            </div>
            {report && (
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-500">{report.overall_score}%</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Modernization Score</div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Paste Lovable Preview URL..." 
                className="pl-9"
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={startQACrawl} disabled={loading || !url}>
              {loading ? 'Starting...' : 'Crawl New Site'}
            </Button>
            <Button onClick={runAnalysis} disabled={loading}>
              Run QA Audit
            </Button>
          </div>

          {report && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold tracking-tight">Modernization Score: {report.overall_score}%</h3>
                  <p className="text-sm text-slate-400">Based on structured AI comparison and content coverage</p>
                </div>
                <Badge className={report.overall_score > 85 ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>
                  {report.repair_priority.toUpperCase()} PRIORITY
                </Badge>
              </div>

              {/* Dimensional Scores */}
              {report.scores && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {Object.entries(report.scores).map(([key, value]: [string, any]) => (
                    <div key={key} className="bg-slate-900/50 rounded-lg p-3 border border-white/5 flex flex-col items-center text-center">
                      <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-1 leading-tight">{key.replace(/_/g, ' ')}</p>
                      <p className="text-lg font-mono font-bold text-blue-400">{value}%</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-900/40 border-white/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                      Detected Gaps
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {report.missing_pages?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase mb-2">Missing Pages</p>
                        <ul className="space-y-1">
                          {report.missing_pages.map((page: string, i: number) => (
                            <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                              <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                              {page}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {report.missing_content?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase mb-2">Missing Content</p>
                        <ul className="space-y-1">
                          {report.missing_content.map((item: string, i: number) => (
                            <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                              <span className="mt-1.5 w-1 h-1 rounded-full bg-orange-400 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/40 border-white/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-400" />
                      AI Repair Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <ul className="space-y-2">
                        {report.repair_actions?.map((action: string, i: number) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start gap-3 bg-blue-500/5 p-2 rounded border border-blue-500/10">
                            <span className="font-bold text-blue-500">{i + 1}.</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                      
                      <Button variant="outline" size="sm" className="w-full h-8 text-[11px] border-blue-500/20 hover:bg-blue-500/10" onClick={() => {
                        const prompt = `FIX-ONLY REQUEST:\n\nIssues detected during QA:\n${report.repair_actions.join('\n')}\n\nPlease apply specific fixes to address these gaps without full-site regeneration.`;
                        navigator.clipboard.writeText(prompt);
                        alert('Repair Prompt Copied!');
                      }}>
                        <ExternalLink className="h-3 w-3 mr-2" />
                        Copy Full Repair Prompt
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
