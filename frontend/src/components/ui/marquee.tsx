import * as React from "react"
import { cn } from "@/lib/utils"

export interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  pauseOnHover?: boolean
  direction?: "left" | "right" | "up" | "down"
  children: React.ReactNode
}

export function Marquee({
  className,
  pauseOnHover = false,
  direction = "left",
  children,
  ...props
}: MarqueeProps) {
  const isVertical = direction === "up" || direction === "down"
  const isReverse = direction === "right" || direction === "down"

  return (
    <div
      className={cn(
        "group flex overflow-hidden",
        isVertical ? "flex-col" : "flex-row",
        className
      )}
      {...props}
    >
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex shrink-0 justify-around [gap:var(--gap)]",
            isVertical ? "flex-col animate-marquee-vertical" : "flex-row animate-marquee",
            pauseOnHover && "group-hover:[animation-play-state:paused]",
            isReverse && "[animation-direction:reverse]"
          )}
        >
          {children}
        </div>
      ))}
    </div>
  )
}
