import * as React from "react"

export function cva(base: string, options?: { variants?: any, defaultVariants?: any }) {
  return (props?: any) => {
    let classes = base
    if (options?.variants && props) {
      Object.keys(options.variants).forEach(key => {
        const variantValue = props[key] || options.defaultVariants?.[key]
        if (variantValue && options.variants[key][variantValue]) {
          classes += " " + options.variants[key][variantValue]
        }
      })
    }
    if (props?.className) classes += " " + props.className
    return classes
  }
}

export const Slot = React.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => {
  if (React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      ...(children.props as any),
      ref: (node: any) => {
        if (typeof ref === 'function') ref(node)
        else if (ref) (ref as any).current = node
        if ((children as any).ref) (children as any).ref(node)
      }
    } as any)
  }
  return children as any
})
Slot.displayName = "Slot"
