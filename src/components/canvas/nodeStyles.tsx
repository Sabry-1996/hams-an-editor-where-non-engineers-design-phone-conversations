import React from 'react';
import { Database, Layers, MessageSquare, Mic, Play, Share2, Square, Zap } from 'lucide-react';
import type { NodeKind } from '../../types/flow';

interface NodeStyle {
  headerClass: string;
  icon: React.ReactNode;
}

const ICON = 'w-4 h-4';

export const NODE_STYLES: Record<NodeKind, NodeStyle> = {
  start: { headerClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-600', icon: <Play className={ICON} /> },
  say: { headerClass: 'bg-teal-950/80 text-teal-300 border-teal-600', icon: <MessageSquare className={ICON} /> },
  ask: { headerClass: 'bg-blue-950/80 text-blue-300 border-blue-600', icon: <Mic className={ICON} /> },
  condition: { headerClass: 'bg-amber-950/80 text-amber-300 border-amber-600', icon: <Zap className={ICON} /> },
  tool: { headerClass: 'bg-purple-950/80 text-purple-300 border-purple-600', icon: <Database className={ICON} /> },
  transfer: { headerClass: 'bg-rose-950/80 text-rose-300 border-rose-600', icon: <Share2 className={ICON} /> },
  end: { headerClass: 'bg-slate-800 text-slate-400 border-slate-600', icon: <Square className={ICON} /> }
};

export const FALLBACK_NODE_STYLE: NodeStyle = {
  headerClass: 'bg-slate-800 text-slate-200 border-slate-700',
  icon: <Layers className={ICON} />
};

export const NODE_WIDTH = 240;
export const NODE_PORT_OFFSET_X = 240;
export const NODE_PORT_OFFSET_Y = 28;
