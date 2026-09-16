"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";

interface Props {
  message: string;
  raw?: unknown;
  className?: string;
}

export function AdminErrorBox({ message, raw, className }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm ${className ?? ""}`}>
      <div className="flex items-start gap-2">
        <AlertCircle size={14} className="mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p>{message}</p>
          {raw != null && (
            <>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 text-xs opacity-60 hover:opacity-90 mt-1.5 transition-opacity"
              >
                <ChevronDown size={12} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
                Detalhes técnicos
              </button>
              {expanded && (
                <pre className="mt-2 text-xs bg-black/20 rounded-lg p-2 overflow-auto max-h-48 text-red-300/80 whitespace-pre-wrap break-all">
                  {typeof raw === "string" ? raw : JSON.stringify(raw, null, 2)}
                </pre>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
