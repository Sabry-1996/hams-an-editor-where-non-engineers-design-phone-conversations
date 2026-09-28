import React, { useCallback } from "react";
import { Panel, useReactFlow } from "@xyflow/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  ArrowDownUp,
  ArrowLeftRight,
  Maximize,
  PhoneCall,
  Plus,
  Redo2,
  Trash2,
  Undo2,
  Wand2,
} from "lucide-react";
import { useFlow } from "../../context/FlowContext";
import { useI18n } from "../../i18n/I18nContext";
import type { NodeKind } from "../../types/flow";
import { Button } from "../ui/Button";
import { Tooltip } from "../ui/Tooltip";
import { StepPalette } from "./AddStepMenu";

const ICON = "w-4 h-4";

function ToolButton({
  label,
  icon,
  onClick,
  disabled,
  active,
  expanded,
  className,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  expanded?: boolean;
  className?: string;
}) {
  return (
    <Tooltip label={label}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={label}
        aria-expanded={expanded}
        active={active}
        disabled={disabled}
        onClick={onClick}
        className={className}
      >
        {icon}
      </Button>
    </Tooltip>
  );
}

const Divider = () => (
  <div className="h-px bg-line my-1 mx-1" role="separator" />
);

interface BoardControlsProps {
  onQuickCall: () => void;
  paletteOpen: boolean;
  onPaletteOpenChange: (open: boolean) => void;
}

export function BoardControls({
  onQuickCall,
  paletteOpen,
  onPaletteOpenChange,
}: BoardControlsProps) {
  const { t } = useI18n();
  const { fitView } = useReactFlow();
  const {
    flow,
    selectedIds,
    deleteSelected,
    canUndo,
    canRedo,
    undo,
    redo,
    layoutDirection,
    setLayoutDirection,
    tidyUp,
    addNode,
  } = useFlow();

  const anchorId = selectedIds.length === 1 ? selectedIds[0] : undefined;
  const anchor = anchorId
    ? flow.nodes.find((n) => n.id === anchorId)
    : undefined;
  const closePalette = useCallback(
    () => onPaletteOpenChange(false),
    [onPaletteOpenChange],
  );
  const pick = useCallback(
    (kind: NodeKind) => addNode(kind, { afterId: anchorId }),
    [addNode, anchorId],
  );

  return (
    <Panel position="top-left" className="m-3!">
      <div className="relative">
        <div
          role="toolbar"
          aria-orientation="vertical"
          aria-label={t("board_tools")}
          className="flex flex-col bg-white border border-line rounded-2xl p-1 shadow-card"
        >
          <ToolButton
            label={paletteOpen ? t("close") : t("add_node")}
            icon={<Plus className={ICON} />}
            onClick={() => onPaletteOpenChange(!paletteOpen)}
            active={paletteOpen}
            expanded={paletteOpen}
            className={paletteOpen ? "" : "text-brand"}
          />
          <Divider />
          <ToolButton
            label={t("undo")}
            icon={<Undo2 className={ICON} />}
            onClick={undo}
            disabled={!canUndo}
          />
          <ToolButton
            label={t("redo")}
            icon={<Redo2 className={ICON} />}
            onClick={redo}
            disabled={!canRedo}
          />
          <Divider />
          <ToolButton
            label={t("layout_horizontal")}
            icon={<ArrowLeftRight className={ICON} />}
            onClick={() => setLayoutDirection("horizontal")}
            active={layoutDirection === "horizontal"}
          />
          <ToolButton
            label={t("layout_vertical")}
            icon={<ArrowDownUp className={ICON} />}
            onClick={() => setLayoutDirection("vertical")}
            active={layoutDirection === "vertical"}
          />
          <ToolButton
            label={t("tidy_up")}
            icon={<Wand2 className={ICON} />}
            onClick={tidyUp}
          />
          <ToolButton
            label={t("fit_view")}
            icon={<Maximize className={ICON} />}
            onClick={() => fitView({ duration: 300, padding: 0.2, maxZoom: 1 })}
          />
          <Divider />
          <ToolButton
            label={t("delete_node")}
            icon={<Trash2 className={ICON} />}
            onClick={deleteSelected}
            disabled={selectedIds.length === 0}
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          />
          <ToolButton
            label={t("quick_call")}
            icon={<PhoneCall className={ICON} />}
            onClick={onQuickCall}
            className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
          />
        </div>
        <MotionConfig reducedMotion="never">
          <AnimatePresence>
            {paletteOpen && (
              <motion.div
                key="palette"
                className="absolute top-0 left-full z-50 ms-3 origin-top-left"
                initial={{ opacity: 0, x: -10, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -10, scale: 0.96 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <StepPalette
                  anchorLabel={anchor?.label}
                  onPick={pick}
                  onClose={closePalette}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </MotionConfig>
      </div>
    </Panel>
  );
}
