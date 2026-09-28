import clsx from "clsx";
import { InputHTMLAttributes, LabelHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={clsx(
        "mb-1.5 block text-sm font-semibold text-brand-navy/80",
        props.className,
      )}
    />
  );
}

export function Input({
  className,
  invalid,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-xl border-2 bg-white px-4 py-3 text-base text-brand-navy placeholder:text-brand-navy/40",
        invalid ? "border-status-reserved" : "border-brand-cream-dark focus:border-brand-teal",
        "outline-none transition-colors",
        className,
      )}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        "w-full rounded-xl border-2 border-brand-cream-dark bg-white px-4 py-3 text-base text-brand-navy placeholder:text-brand-navy/40 focus:border-brand-teal outline-none transition-colors",
        className,
      )}
    />
  );
}

export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return <p className="mt-1.5 text-sm font-medium text-status-reserved">{children}</p>;
}
