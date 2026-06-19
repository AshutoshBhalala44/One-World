import { memo } from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

const SHIMMER_STYLE: React.CSSProperties = {
  background:
    "linear-gradient(90deg, transparent 0%, hsl(40 95% 55% / 0.06) 50%, transparent 100%)",
};

const Skeleton = memo(function Skeleton({ className, shimmer, ...props }: SkeletonProps) {
  if (shimmer) {
    return (
      <div
        className={cn("relative overflow-hidden rounded-md bg-muted", className)}
        {...props}
      >
        <div
          className="absolute inset-0 -translate-x-full animate-shimmer"
          style={SHIMMER_STYLE}
        />
      </div>
    );
  }
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
});

export { Skeleton };

