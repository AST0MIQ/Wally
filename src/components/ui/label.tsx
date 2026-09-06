import * as React from "react";
import { cn } from "@/lib/utils";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none text-foreground",
      className,
    )}
    {...props}
  />
));
Label.displayName = "Label";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const generatedId = React.useId();
  const child = React.isValidElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>(children) ? children : null;
  const id = htmlFor ?? child?.props.id ?? generatedId;
  const descriptionId = `${id}-description`;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      {child ? React.cloneElement(child, { id, "aria-describedby": error || hint ? descriptionId : child.props["aria-describedby"], "aria-invalid": error ? true : child.props["aria-invalid"] }) : children}
      {hint && !error && (
        <p id={descriptionId} className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <p id={descriptionId} role="alert" className="text-xs text-negative">{error}</p>}
    </div>
  );
}
