"use client";

import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathProps {
  children: string;
  block?: boolean;
}

export function Math({ children, block = false }: MathProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(children, ref.current, {
          displayMode: block,
          throwOnError: false,
        });
      } catch (error) {
        console.error("KaTeX rendering error:", error);
        if (ref.current) {
          ref.current.textContent = children;
        }
      }
    }
  }, [children, block]);

  return <span ref={ref} />;
}
