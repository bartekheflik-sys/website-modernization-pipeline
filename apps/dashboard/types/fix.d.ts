import * as React from "react"

declare module "class-variance-authority" {
  export function cva(base?: string, options?: any): any;
  export type VariantProps<T> = any;
}

declare module "@radix-ui/react-slot" {
  export const Slot: React.ForwardRefExoticComponent<any>;
}

declare module "lucide-react" {
  export const Loader2: React.ForwardRefExoticComponent<any>;
  export const Search: React.ForwardRefExoticComponent<any>;
  export const Plus: React.ForwardRefExoticComponent<any>;
  export const Globe: React.ForwardRefExoticComponent<any>;
  export const Layout: React.ForwardRefExoticComponent<any>;
  export const CheckCircle: React.ForwardRefExoticComponent<any>;
  export const AlertCircle: React.ForwardRefExoticComponent<any>;
  export const ExternalLink: React.ForwardRefExoticComponent<any>;
  export const Filter: React.ForwardRefExoticComponent<any>;
  export const ChevronLeft: React.ForwardRefExoticComponent<any>;
  export const Globe: React.ForwardRefExoticComponent<any>;
  export const ArrowUpRight: React.ForwardRefExoticComponent<any>;
}
