'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Badge } from './ui/badge'
import { ImageIcon, Maximize2, ShieldCheck, Zap, Scissors, RefreshCw, FileImage } from 'lucide-react'
import { cn } from '../lib/utils'

export function AssetGallery({ projectId }: { projectId: string }) {
  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('website_assets')
        .select('*')
        .eq('project_id', projectId)
        .order('quality_score', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) return <div>Loading assets...</div>;
  if (!assets || assets.length === 0) return null;

  return (
    <Card className="glass-card border-white/5 overflow-hidden">
      <CardHeader className="border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Asset Intelligence Gallery
            </CardTitle>
            <CardDescription>
              AI-classified and quality-vetted website assets for modernization.
            </CardDescription>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              Preserve
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              Enhance
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-violet-500" />
              Generate
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-white/5">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AssetCard({ asset }: { asset: any }) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'preserve': return <ShieldCheck className="h-3 w-3" />;
      case 'enhance': return <Zap className="h-3 w-3" />;
      case 'vectorize': return <Scissors className="h-3 w-3" />;
      case 'generate': return <RefreshCw className="h-3 w-3" />;
      default: return <FileImage className="h-3 w-3" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'preserve': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'enhance': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'vectorize': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'generate': return 'text-violet-500 bg-violet-500/10 border-violet-500/20';
      case 'replace': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="group relative bg-card/40 backdrop-blur-sm p-4 hover:bg-white/[0.03] transition-all overflow-hidden aspect-square flex flex-col gap-3">
      {/* Thumbnail Area */}
      <div className="relative flex-1 bg-black/20 rounded-lg overflow-hidden flex items-center justify-center">
        <img 
          src={asset.asset_url} 
          alt={asset.alt_text} 
          className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Quality Badge Overlay */}
        <div className="absolute top-2 right-2">
          <div className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md shadow-lg",
            asset.quality_score > 80 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : 
            asset.quality_score > 50 ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : 
            "bg-rose-500/20 text-rose-400 border-rose-500/30"
          )}>
            {asset.quality_score}%
          </div>
        </div>

        {/* Action Overlay */}
        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <Maximize2 className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Metadata Area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="text-[9px] uppercase tracking-tighter px-1.5 h-4 border-white/10 font-bold bg-white/[0.02]">
            {asset.asset_type}
          </Badge>
          <div className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider leading-none",
            getActionColor(asset.recommended_action)
          )}>
            {getActionIcon(asset.recommended_action)}
            {asset.recommended_action}
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
             <span className="truncate max-w-[100px]">{asset.file_type?.toUpperCase()}</span>
             <span>{asset.dimensions?.width}x{asset.dimensions?.height}</span>
          </div>
          {asset.business_critical && (
             <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-1">
               <ShieldCheck className="h-3 w-3" />
               Business Critical
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
