import React from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { useI18n } from "../../i18n/I18nContext";
import type { FlowNode } from "../../types/flow";
import type { LayoutDirection } from "../../utils/autoLayout";
import { EDGE_COLORS, NODE_STYLES } from "./nodeStyles";

export interface StepNodeData extends Record<string, unknown> {
  node: FlowNode;
  direction: LayoutDirection;
  active: boolean;
  hasIssue: boolean;
}

export type StepRFNode = Node<StepNodeData, "step">;

function preview(node: FlowNode): string {
  const data = node.data;
  if (data.kind === "say") return data.text.ar || data.text.en;
  if (data.kind === "ask") return data.prompt.ar || data.prompt.en;
  if (data.kind === "tool") return data.name;
  if (data.kind === "transfer") return data.queue;
  if (data.kind === "end") return data.text?.ar || data.text?.en || "";
  if (data.kind === "condition")
    return data.rules
      .map((rule) => rule.variable)
      .filter(Boolean)
      .join(", ");
  return "";
}

function savedAs(node: FlowNode): string {
  if (
    (node.data.kind === "ask" || node.data.kind === "tool") &&
    node.data.saveAs
  )
    return `{{${node.data.saveAs}}}`;
  return "";
}

const HANDLE: React.CSSProperties = {
  width: 12,
  height: 12,
  border: "2px solid #ffffff",
  boxShadow: "0 0 0 1px #e0e1e4",
};

export const StepNode = React.memo(function StepNode({
  data,
  selected,
}: NodeProps<StepRFNode>) {
  const { t } = useI18n();
  const { node, direction, active, hasIssue } = data;
  const horizontal = direction === "horizontal";
  const kind = node.data.kind;
  const style = NODE_STYLES[kind];
  const text = preview(node);
  const chip = savedAs(node);
  const ring = active
    ? "border-amber-400 ring-4 ring-amber-200"
    : selected
      ? "border-brand ring-4 ring-brand/15"
      : hasIssue
        ? "border-rose-400"
        : "border-line hover:border-ink-3";
  const sourceSide = horizontal ? Position.Right : Position.Bottom;
  const offsetKey = horizontal ? "top" : "left";

  return (
    <div
      className={`relative w-[240px] bg-white rounded-2xl border shadow-card transition-colors ${ring}`}
      aria-label={`${t(kind)} ${node.label}`}
    >
      {kind !== "start" && (
        <Handle
          type="target"
          position={horizontal ? Position.Left : Position.Top}
          style={{ ...HANDLE, background: "#c9cbd1" }}
        />
      )}
      <div
        className={`flex items-center justify-between px-3 py-2 rounded-t-2xl border-b ${style.headerClass}`}
      >
        <div className="flex items-center gap-2">
          {style.icon}
          <span className="text-xs font-semibold">{t(kind)}</span>
        </div>
        {hasIssue && (
          <span
            className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center"
            aria-label={t("level_error")}
          >
            !
          </span>
        )}
      </div>
      <div className="p-3 text-xs space-y-2">
        <div className="font-semibold text-ink truncate">{node.label}</div>
        {text && (
          <p
            className="text-[11px] text-ink-2 line-clamp-2 bg-surface p-2 rounded-lg border border-line-soft"
            dir="auto"
          >
            {text}
          </p>
        )}
        {chip && <div className="text-[10px] font-mono text-brand">{chip}</div>}
        {kind === "tool" && (
          <div
            className={`flex text-[10px] font-mono ${horizontal ? "flex-col items-end gap-1" : "justify-around"}`}
          >
            <span className="text-violet-700">ok</span>
            <span className="text-rose-600">error</span>
          </div>
        )}
      </div>
      {kind === "tool" ? (
        <>
          <Handle
            type="source"
            id="ok"
            position={sourceSide}
            style={{ ...HANDLE, background: style.accent, [offsetKey]: "35%" }}
          />
          <Handle
            type="source"
            id="error"
            position={sourceSide}
            style={{
              ...HANDLE,
              background: EDGE_COLORS.error,
              [offsetKey]: "65%",
            }}
          />
        </>
      ) : kind !== "end" ? (
        <Handle
          type="source"
          position={sourceSide}
          style={{ ...HANDLE, background: style.accent }}
        />
      ) : null}
    </div>
  );
});
