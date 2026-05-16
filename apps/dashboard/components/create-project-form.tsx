'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { createProject } from '@/services/api'
import { Plus, Loader2, Link2, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export function CreateProjectForm() {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return

    setIsLoading(true)
    try {
      const result = await createProject(url)
      if (result.id) {
        router.push(`/projects/${result.id}`)
      }
    } catch (error) {
      console.error(error)
      alert('Failed to create project')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-bold uppercase tracking-widest text-primary/80">New Deployment</h2>
        <p className="text-muted-foreground text-xs font-medium">Initialize a new modernization pipeline by providing a target URL.</p>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <div className={cn(
          "relative flex items-center transition-all duration-300 rounded-2xl border bg-background/50 backdrop-blur-xl px-4 py-2 shadow-2xl",
          isFocused ? "border-primary ring-4 ring-primary/10 -translate-y-1" : "border-white/10"
        )}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mr-3">
            <Link2 className="h-5 w-5" />
          </div>
          <input
            type="url"
            placeholder="https://modernize-this-site.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="flex-1 bg-transparent border-none outline-none text-base font-medium placeholder:text-muted-foreground/50 h-12"
            required
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={isLoading || !url} 
            className="rounded-xl premium-gradient h-12 px-6 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Initializing...' : 'Analyze Website'}
          </Button>
        </div>
        
        <div className="mt-4 flex items-center gap-4 text-[10px] font-bold text-muted-foreground/60 px-2 uppercase tracking-widest">
          <span className="flex items-center gap-1.5"><div className="h-1 w-1 rounded-full bg-emerald-500" /> Auto-detection</span>
          <span className="flex items-center gap-1.5"><div className="h-1 w-1 rounded-full bg-blue-500" /> Deep Extraction</span>
          <span className="flex items-center gap-1.5"><div className="h-1 w-1 rounded-full bg-violet-500" /> AI Refinement</span>
        </div>
      </form>
    </div>
  )
}
