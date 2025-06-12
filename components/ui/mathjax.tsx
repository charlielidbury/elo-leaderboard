"use client";

import { useEffect, useRef } from "react";

interface MathJaxProps {
  math: string;
  display?: boolean;
  className?: string;
}

declare global {
  interface Window {
    MathJax: any;
  }
}

export function MathJax({
  math,
  display = false,
  className = "",
}: MathJaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && typeof window !== "undefined" && window.MathJax) {
      // Clear the container
      ref.current.innerHTML = display ? `$$${math}$$` : `$${math}$`;

      // Typeset the math
      window.MathJax.startup.promise.then(() => {
        window.MathJax.typesetPromise([ref.current]).catch((err: any) =>
          console.log(err)
        );
      });
    }
  }, [math, display]);

  return <div ref={ref} className={className} />;
}
