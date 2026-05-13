import * as React from "react"
import { cn } from "../../lib/utils"

const Accordion = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("space-y-1", className)}>{children}</div>
)

const AccordionItem = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("border-b", className)}>{children}</div>
)

const AccordionTrigger = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <button className={cn("flex w-full items-center justify-between py-4 font-medium transition-all hover:underline", className)}>
    {children}
  </button>
)

const AccordionContent = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("overflow-hidden text-sm transition-all pb-4", className)}>{children}</div>
)

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
