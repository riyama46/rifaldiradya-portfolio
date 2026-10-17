import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "soft" | "ghost" | "danger";
type Size = "icon" | "sm" | "md" | "lg";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof CommonProps> & {
    href?: undefined;
    loading?: boolean;
  };

type ButtonAsLink = CommonProps &
  Omit<ComponentPropsWithoutRef<"a">, keyof CommonProps | "href"> & {
    href: string;
    external?: boolean;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const base =
  "group inline-flex items-center justify-center gap-2 rounded-button border font-sans font-medium leading-none " +
  "cursor-pointer select-none transition-[background-color,border-color,color,text-decoration-color,transform] duration-200 ease-out " +
  "motion-safe:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

const variants: Record<Variant, string> = {
  primary: "border-transparent bg-accent text-on-accent hover:bg-accent-hover",
  // Admin only (Delta SDD section 8: --color-danger is for admin errors and destructive actions).
  danger: "border-danger/45 bg-transparent text-danger hover:bg-danger/10",
  secondary: "border-text-muted bg-transparent text-text hover:bg-text/8",
  // Second action next to a primary on public pages (option-b.html .btn.alt): an ink tint, no line.
  soft: "border-transparent bg-text/9 text-text hover:bg-text/16",
  ghost:
    "border-transparent bg-transparent text-text underline decoration-text-muted decoration-1 underline-offset-[5px] hover:text-accent hover:decoration-accent",
};

const heights: Record<Size, string> = {
  icon: "size-11 text-base",
  sm: "min-h-11 text-[0.9375rem]",
  md: "min-h-12 text-base",
  lg: "min-h-13 text-[1.0625rem]",
};

const paddings: Record<Size, string> = {
  icon: "px-0",
  sm: "px-3.5",
  md: "px-5",
  lg: "px-7",
};

function classesFor(variant: Variant, size: Size, className?: string) {
  return cn(
    base,
    variants[variant],
    heights[size],
    variant === "ghost" ? "px-1" : paddings[size],
    className,
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  );
}

export function Button(props: ButtonProps) {
  if (props.href !== undefined) {
    const {
      variant = "primary",
      size = "md",
      className,
      children,
      href,
      external,
      ...rest
    } = props;
    const classes = classesFor(variant, size, className);

    if (href.startsWith("/") && !external) {
      return (
        <Link href={href} className={classes} {...rest}>
          {children}
        </Link>
      );
    }

    return (
      <a
        href={href}
        className={classes}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  }

  const {
    variant = "primary",
    size = "md",
    className,
    children,
    loading = false,
    disabled,
    type = "button",
    ...rest
  } = props;

  return (
    <button
      type={type}
      className={classesFor(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
