import React from "react";
import Link from "next/link";

interface TextArrowLinkProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function TextArrowLink({
  href,
  onClick,
  children,
  className = "",
}: TextArrowLinkProps) {
  const base =
    "inline-flex items-center gap-1 text-[15px] font-medium text-[#17191c] hover:underline underline-offset-4 decoration-[#17191c]/50 transition-colors cursor-pointer bg-transparent border-0 p-0";

  if (href) {
    return (
      <Link href={href} className={`${base} ${className}`}>
        <span>{children} →</span>
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={`${base} ${className}`}>
      <span>{children} →</span>
    </button>
  );
}
