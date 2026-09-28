import clsx from "clsx";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-brand-orange text-white hover:bg-brand-orange-dark disabled:bg-brand-orange/50",
  secondary:
    "bg-brand-teal text-white hover:bg-brand-teal-dark disabled:bg-brand-teal/50",
  outline:
    "border-2 border-brand-teal text-brand-teal bg-transparent hover:bg-brand-teal/10 disabled:opacity-50",
  ghost: "text-brand-navy hover:bg-brand-navy/5 disabled:opacity-50",
  danger: "bg-status-reserved text-white hover:opacity-90 disabled:opacity-50",
};

const SIZE_CLASSES: Record<Size, string> = {
  md: "px-4 py-2.5 text-sm rounded-xl",
  lg: "px-6 py-4 text-base rounded-2xl",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(function Button(
  { className, variant = "primary", size = "md", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    />
  );
});
