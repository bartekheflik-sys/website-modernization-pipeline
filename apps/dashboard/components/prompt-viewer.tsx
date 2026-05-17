'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Button } from "./ui/button"
import { GeneratedPrompt } from '../types'
import { ExternalLink, CheckCircle, ArrowUpRight, Globe, AlertCircle, Search } from 'lucide-react'
import { Badge } from './ui/badge'

export function PromptViewer({ prompt }: { prompt: GeneratedPrompt | null }) {
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedPrompt, setEditedPrompt] = useState(prompt?.prompt || '')
  const [isSaving, setIsSaving] = useState(false)

  if (!prompt) {
    return (
      <Card className="flex h-64 flex-col items-center justify-center text-center p-8 bg-muted/20 border-dashed">
        <Globe className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <CardTitle className="text-muted-foreground">No Prompt Generated Yet</CardTitle>
        <CardDescription>
          Run the prompt generation step to see the results.
        </CardDescription>
      </Card>
    )
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(prompt.prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadPrompt = () => {
    const blob = new Blob([prompt.prompt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lovable-prompt-${prompt.project_id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadZipPackage = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    window.open(`${API_URL}/api/projects/${prompt.project_id}/export`, '_blank')
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="border-b pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Lovable Generation Prompt
            </CardTitle>
            <CardDescription className="mt-1">
              Deterministic website specification for Lovable.ai
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => {
                setEditedPrompt(prompt.prompt)
                setIsEditing(true)
              }}>
                Edit
              </Button>
            ) : (
              <Button 
                variant="default" 
                size="sm" 
                disabled={isSaving}
                onClick={async () => {
                  setIsSaving(true)
                  try {
                    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                    const res = await fetch(`${API_URL}/api/projects/${prompt.project_id}/prompt`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ prompt: editedPrompt })
                    })
                    if (!res.ok) throw new Error('Failed to save')
                    setIsEditing(false)
                  } catch (err) {
                    alert('Error saving prompt')
                  } finally {
                    setIsSaving(false)
                  }
                }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={downloadPrompt}>
              Download TXT
            </Button>
            <Button variant="outline" size="sm" onClick={downloadZipPackage} className="border-primary/50 text-primary hover:bg-primary/10">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Export Lovable ZIP
            </Button>
            <Button variant="default" size="sm" onClick={copyToClipboard} className="min-w-[100px]">
              {copied ? <CheckCircle className="h-4 w-4 mr-2" /> : <ExternalLink className="h-4 w-4 mr-2" />}
              {copied ? 'Copied' : 'Copy Prompt'}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border text-xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Style:</span>
            <span className="font-semibold">{prompt.metadata.design_style.split(',')[0]}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border text-xs">
            <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Motion:</span>
            <Badge variant="outline" className="h-5 capitalize">{prompt.metadata.motion_level}</Badge>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border text-xs">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Structure:</span>
            <span className="font-semibold">{prompt.metadata.pages.length} Pages, {prompt.metadata.sections_count} Sections</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative group">
          {isEditing ? (
            <textarea
              className="w-full h-[600px] p-6 text-sm font-mono bg-background focus:outline-none focus:ring-1 focus:ring-primary/50 leading-relaxed resize-none"
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              placeholder="Edit your prompt here..."
            />
          ) : (
            <>
              <pre className="p-6 text-sm font-mono whitespace-pre-wrap overflow-y-auto max-h-[600px] leading-relaxed scrollbar-thin scrollbar-thumb-muted">
                {prompt.prompt}
              </pre>
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent pointer-events-none" />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
