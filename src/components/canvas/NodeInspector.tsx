import { Plus, Trash2, X } from "lucide-react";
import { motion } from "motion/react";
import { useFlow } from "../../context/FlowContext";
import { useI18n } from "../../i18n/I18nContext";
import type {
  CompareOp,
  ConditionRule,
  ExpectKind,
  FlowNode,
  LocalizedText,
  NoInputAction,
} from "../../types/flow";
import type { MessageKey } from "../../i18n/messages";
import { Button } from "../ui/Button";
import { Field, inputClass } from "../ui/Field";
import { Select } from "../ui/Select";
import { LocalizedFields, SuggestText } from "./inspector/LocalizedFields";
import { NODE_STYLES } from "./nodeStyles";

const OPS: CompareOp[] = ["eq", "neq", "gt", "lt", "exists"];
const EXPECTS: Array<{ value: ExpectKind; key: MessageKey }> = [
  { value: "digits", key: "expect_digits" },
  { value: "yes_no", key: "expect_yes_no" },
  { value: "date", key: "expect_date" },
  { value: "free_text", key: "expect_free_text" },
];

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">
    {children}
  </p>
);

/** Details panel for one step. Mount it inside an `AnimatePresence` so it slides in and out. */
export function NodeInspector({ node }: { node: FlowNode }) {
  const { t, dir } = useI18n();
  const {
    flow,
    renameNode,
    setNodeData,
    deleteSelected,
    disconnect,
    upstreamVariablesOf,
    clearSelection,
  } = useFlow();
  const from = dir === "rtl" ? -320 : 320;
  const data = node.data;
  const style = NODE_STYLES[data.kind];
  const variables = upstreamVariablesOf(node.id);
  const edges = flow.edges.filter((edge) => edge.from === node.id);
  const others = flow.nodes.filter((item) => item.id !== node.id);

  const setText = (text: LocalizedText) => {
    if (data.kind === "say") setNodeData(node.id, { ...data, text });
    if (data.kind === "ask") setNodeData(node.id, { ...data, prompt: text });
    if (data.kind === "transfer")
      setNodeData(node.id, { ...data, whisper: text });
    if (data.kind === "end") setNodeData(node.id, { ...data, text });
  };

  const updateRule = (index: number, patch: Partial<ConditionRule>) => {
    if (data.kind !== "condition") return;
    const rules = data.rules.map((rule, i) =>
      i === index ? { ...rule, ...patch } : rule,
    );
    setNodeData(node.id, { ...data, rules });
  };

  return (
    <motion.aside
      className="w-80 shrink-0 bg-white border-s border-line flex flex-col z-20 overflow-y-auto"
      aria-label={t("inspector")}
      initial={{ x: from, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: from, opacity: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 36, mass: 0.8 }}
    >
      <div key={node.id} className="content-in flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`p-1.5 rounded-lg border ${style.headerClass}`}>
              {style.icon}
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-ink truncate">
                {node.label}
              </h2>
              <p className="text-[11px] text-ink-3">{t(data.kind)}</p>
            </div>
          </div>
          <div className="flex items-center">
            <Button
              variant="danger"
              size="icon"
              className="h-8 w-8"
              onClick={deleteSelected}
              aria-label={t("delete_node")}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={clearSelection}
              aria-label={t("close")}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Field label={t("node_label")}>
          <input
            className={inputClass}
            value={node.label}
            onChange={(e) => renameNode(node.id, e.target.value)}
          />
        </Field>
        <Field label={t("node_id")}>
          <input
            className={`${inputClass} font-mono text-ink-3 bg-surface`}
            readOnly
            value={node.id}
          />
        </Field>

        {(data.kind === "say" || data.kind === "ask") && (
          <LocalizedFields
            text={data.kind === "say" ? data.text : data.prompt}
            variables={variables}
            onChange={setText}
          />
        )}
        {data.kind === "end" && (
          <LocalizedFields
            text={data.text ?? { ar: "", en: "" }}
            variables={variables}
            onChange={setText}
          />
        )}
        {data.kind === "transfer" && (
          <>
            <Field label={t("queue")}>
              <input
                className={inputClass}
                value={data.queue}
                onChange={(e) =>
                  setNodeData(node.id, { ...data, queue: e.target.value })
                }
              />
            </Field>
            <SectionTitle>{t("whisper")}</SectionTitle>
            <LocalizedFields
              text={data.whisper ?? { ar: "", en: "" }}
              variables={variables}
              onChange={setText}
            />
          </>
        )}

        {data.kind === "ask" && (
          <>
            <Field label={t("save_as")}>
              <input
                className={`${inputClass} font-mono`}
                value={data.saveAs}
                onChange={(e) =>
                  setNodeData(node.id, {
                    ...data,
                    saveAs: e.target.value.trim(),
                  })
                }
              />
            </Field>
            <Field label={t("expect")}>
              <Select
                ariaLabel={t("expect")}
                value={data.expect}
                onValueChange={(expect) =>
                  setNodeData(node.id, {
                    ...data,
                    expect: expect as ExpectKind,
                  })
                }
                options={EXPECTS.map((item) => ({
                  value: item.value,
                  label: t(item.key),
                }))}
              />
            </Field>
            <Field label={t("on_no_input")}>
              <Select
                ariaLabel={t("on_no_input")}
                value={data.onNoInput}
                onValueChange={(onNoInput) =>
                  setNodeData(node.id, {
                    ...data,
                    onNoInput: onNoInput as NoInputAction,
                  })
                }
                options={[
                  { value: "reprompt", label: t("reprompt") },
                  { value: "transfer", label: t("transfer_action") },
                ]}
              />
            </Field>
            <Field label={t("max_retries")}>
              <input
                type="number"
                min={1}
                className={inputClass}
                value={data.maxRetries}
                onChange={(e) =>
                  setNodeData(node.id, {
                    ...data,
                    maxRetries: Number(e.target.value),
                  })
                }
              />
            </Field>
          </>
        )}

        {data.kind === "tool" && (
          <>
            <Field label={t("tool_name")}>
              <input
                className={inputClass}
                value={data.name}
                onChange={(e) =>
                  setNodeData(node.id, { ...data, name: e.target.value })
                }
              />
            </Field>
            <Field label={t("tool_save")}>
              <input
                className={`${inputClass} font-mono`}
                value={data.saveAs}
                onChange={(e) =>
                  setNodeData(node.id, {
                    ...data,
                    saveAs: e.target.value.trim(),
                  })
                }
              />
            </Field>
            <SectionTitle>{t("tool_args")}</SectionTitle>
            {Object.entries(data.args).map(([key, value]) => (
              <div
                key={key}
                className="space-y-1.5 border border-line rounded-xl p-2 bg-surface/60"
              >
                <div className="flex items-center gap-2">
                  <input
                    className={`${inputClass} font-mono`}
                    value={key}
                    readOnly
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      const args = { ...data.args };
                      delete args[key];
                      setNodeData(node.id, { ...data, args });
                    }}
                  >
                    {t("remove")}
                  </Button>
                </div>
                <SuggestText
                  dir="ltr"
                  value={value}
                  variables={variables}
                  onChange={(next) =>
                    setNodeData(node.id, {
                      ...data,
                      args: { ...data.args, [key]: next },
                    })
                  }
                />
              </div>
            ))}
            <Button
              variant="secondary"
              className="self-start"
              onClick={() =>
                setNodeData(node.id, {
                  ...data,
                  args: {
                    ...data.args,
                    [`arg_${Object.keys(data.args).length + 1}`]: "",
                  },
                })
              }
            >
              <Plus className="w-3.5 h-3.5" />
              {t("add_rule")}
            </Button>
          </>
        )}

        {data.kind === "condition" && (
          <>
            <SectionTitle>{t("rules")}</SectionTitle>
            {data.rules.map((rule, index) => (
              <div
                key={index}
                className="space-y-2 border border-line rounded-xl p-2 bg-surface/60"
              >
                <input
                  className={`${inputClass} font-mono`}
                  placeholder={t("variable")}
                  value={rule.variable}
                  onChange={(e) =>
                    updateRule(index, { variable: e.target.value.trim() })
                  }
                  list={`vars-${node.id}`}
                />
                <Select
                  ariaLabel={t("rules")}
                  value={rule.op}
                  onValueChange={(op) =>
                    updateRule(index, { op: op as CompareOp })
                  }
                  options={OPS.map((op) => ({ value: op, label: op }))}
                />
                {rule.op !== "exists" && (
                  <input
                    className={inputClass}
                    placeholder={t("value")}
                    value={rule.value ?? ""}
                    onChange={(e) =>
                      updateRule(index, { value: e.target.value })
                    }
                  />
                )}
                <Select
                  ariaLabel={t("else_branch")}
                  value={rule.branch}
                  placeholder={t("else_branch")}
                  onValueChange={(branch) => updateRule(index, { branch })}
                  options={[
                    { value: "", label: t("else_branch") },
                    ...others.map((item) => ({
                      value: item.id,
                      label: item.label,
                    })),
                  ]}
                />
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    setNodeData(node.id, {
                      ...data,
                      rules: data.rules.filter((_, i) => i !== index),
                    })
                  }
                >
                  {t("remove")}
                </Button>
              </div>
            ))}
            <Button
              variant="secondary"
              className="self-start"
              onClick={() =>
                setNodeData(node.id, {
                  ...data,
                  rules: [
                    ...data.rules,
                    {
                      variable: variables[0] ?? "",
                      op: "eq",
                      value: "",
                      branch: "",
                    },
                  ],
                })
              }
            >
              <Plus className="w-3.5 h-3.5" />
              {t("add_rule")}
            </Button>
            <Field label={t("else_branch")}>
              <Select
                ariaLabel={t("else_branch")}
                value={data.elseBranch}
                placeholder={t("else_branch")}
                onValueChange={(elseBranch) =>
                  setNodeData(node.id, { ...data, elseBranch })
                }
                options={[
                  { value: "", label: t("else_branch") },
                  ...others.map((item) => ({
                    value: item.id,
                    label: item.label,
                  })),
                ]}
              />
            </Field>
            <datalist id={`vars-${node.id}`}>
              {variables.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </>
        )}

        <div className="space-y-1.5">
          <SectionTitle>{t("upstream")}</SectionTitle>
          {variables.length === 0 ? (
            <p className="text-[11px] text-ink-3">{t("upstream_empty")}</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {variables.map((name) => (
                <span
                  key={name}
                  className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-brand-soft text-brand border border-indigo-100"
                >
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <SectionTitle>{t("outputs")}</SectionTitle>
          {edges.length === 0 ? (
            <p className="text-[11px] text-ink-3">{t("no_outputs")}</p>
          ) : (
            <ul className="space-y-1">
              {edges.map((edge) => {
                const target = flow.nodes.find((item) => item.id === edge.to);
                return (
                  <li
                    key={edge.id}
                    className="flex items-center justify-between gap-2 text-xs bg-surface border border-line rounded-lg ps-2.5 pe-1 py-1"
                  >
                    <span className="truncate text-ink">
                      {edge.branch ? (
                        <span className="font-mono text-ink-3">
                          {edge.branch} →{" "}
                        </span>
                      ) : null}
                      {target?.label ?? edge.to}
                    </span>
                    <Button
                      variant="danger"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => disconnect(edge.id)}
                    >
                      {t("remove")}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
