'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import SmoothScrolling from './smooth-scrolling'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5000,
        refetchInterval: 5000, // Polling for live status
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <SmoothScrolling>
        {children}
      </SmoothScrolling>
    </QueryClientProvider>
  )
}
