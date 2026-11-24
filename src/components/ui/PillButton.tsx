import React from "react";
import Link from "next/link";

export interface PillButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "filled" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
}

const variantClasses: Record<"filled" | "ghost", string> = {
  filled:
    "bg-[#17191c] text-[#ffffff] border border-[#17191c] hover:bg-[#2a2d32]",
  ghost:
    "bg-transparent text-[#17191c] border border-[#17191c] hover:bg-[#fafafb]",
};

const sizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "px-4 py-1.5 text-[14px]",
  md: "px-5 py-2.5 text-[15px]",
  lg: "px-6 py-3 text-[16px]",
};

export function PillButton({
  variant = "filled",
  size = "md",
  href,
  className = "",
  children,
  type = "button",
  ...props
}: PillButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-150 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap select-none";
  const classes = `${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
