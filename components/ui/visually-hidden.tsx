import * as React from "react"

export function VisuallyHidden({ children, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className="absolute w-[1px] h-[1px] p-0 -m-[1px] overflow-hidden whitespace-nowrap border-0"
      style={{ clip: "rect(0,0,0,0)" }}
      {...props}
    >
      {children}
    </span>
  )
}
