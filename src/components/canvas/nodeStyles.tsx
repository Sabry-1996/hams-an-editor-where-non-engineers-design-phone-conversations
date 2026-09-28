import React from "react";
import {
  Database,
  MessageSquare,
  Mic,
  Play,
  Share2,
  Square,
  Zap,
} from "lucide-react";
import type { NodeKind } from "../../types/flow";

interface NodeStyle {
  /** Soft tint used for the step header and palette icon. */
  headerClass: string;
  /** Solid accent for the step's source handle. */
  accent: string;
  icon: React.ReactNode;
}

const ICON = "w-4 h-4";

export const NODE_STYLES: Record<NodeKind, NodeStyle> = {
  start: {
    headerClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    accent: "#059669",
    icon: <Play className={ICON} />,
  },
  say: {
    headerClass: "bg-brand-soft text-brand border-indigo-200",
    accent: "#3132a9",
    icon: <MessageSquare className={ICON} />,
  },
  ask: {
    headerClass: "bg-sky-50 text-sky-700 border-sky-200",
    accent: "#0284c7",
    icon: <Mic className={ICON} />,
  },
  condition: {
    headerClass: "bg-amber-50 text-amber-700 border-amber-200",
    accent: "#d97706",
    icon: <Zap className={ICON} />,
  },
  tool: {
    headerClass: "bg-violet-50 text-violet-700 border-violet-200",
    accent: "#7c3aed",
    icon: <Database className={ICON} />,
  },
  transfer: {
    headerClass: "bg-rose-50 text-rose-700 border-rose-200",
    accent: "#e11d48",
    icon: <Share2 className={ICON} />,
  },
  end: {
    headerClass: "bg-surface text-ink-2 border-line",
    accent: "#44464b",
    icon: <Square className={ICON} />,
  },
};

export const EDGE_COLORS = { default: "#3132a9", error: "#e11d48" };
