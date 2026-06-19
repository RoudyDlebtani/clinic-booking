import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "primary" | "positive" | "negative";

const tones: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  positive: "bg-positive/10 text-positive",
  negative: "bg-negative/10 text-negative",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
