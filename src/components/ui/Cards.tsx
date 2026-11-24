import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Neutral Card: superficie #f2f2f3, radio 24px, cero sombra, cero borde.
 */
export function NeutralCard({
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-[#f2f2f3] rounded-[24px] p-5 md:p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Accent Peach Card: superficie #fbe1d1, texto e iconos #5d2a1a, radio 24px, cero sombra.
 * Restriccion editorial: maximo 1 por vista, colocada siempre sobre #ffffff o #fafafb.
 */
export function PeachCard({
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-[#fbe1d1] text-[#5d2a1a] rounded-[24px] p-5 md:p-7 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Floating Product Artifact: superficie #ffffff, radio 20px, sombra sutil editorial.
 */
export function FloatingArtifact({
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-[#ffffff] rounded-[20px] p-5 ${className}`}
      style={{ boxShadow: "var(--shadow-artifact)" }}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Tag / Category Label: texto puro 14px #979799, sin fondo ni borde.
 */
export function CategoryTag({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-block text-[14px] leading-[1.4] text-[#979799] font-normal ${className}`}
    >
      {children}
    </span>
  );
}
