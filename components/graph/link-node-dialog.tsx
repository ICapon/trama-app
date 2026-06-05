"use client";

import { useState } from "react";
import type { TramaNodeCategory, TramaNodeType } from "@/lib/graph/types";
import { TRAMA_NODE_CATEGORIES } from "@/lib/graph/types";
import { CATEGORY_LABELS } from "@/lib/graph/colors";
import type { GraphNodeResponse } from "@/lib/graph/types";

const RELATIONSHIP_TYPES = [
  "RELATED_TO", "ASSOCIATED_WITH", "SAME_AS", "POSSIBLY_SAME_AS",
  "PARENT_OF", "SIBLING_OF", "SPOUSE_OF", "PARTNER_OF", "FRIEND_OF",
  "EMPLOYER_OF", "KNOWN_ASSOCIATE_OF",
  "HAS_ALIAS", "HAS_USERNAME", "HAS_EMAIL", "HAS_PHONE", "HAS_PROFILE",
  "HAS_DOCUMENT", "LIVES_AT",
  "OWNS", "WORKS_AT", "FOUNDED", "REPRESENTS", "SHAREHOLDER_OF",
  "LEGAL_REPRESENTATIVE_OF", "EMPLOYED_BY", "MEMBER_OF", "SUBSIDIARY_OF",
  "LOCATED_AT", "REGISTERED_AT", "OPERATES_IN",
  "HAS_RFC", "HAS_CURP", "HAS_TAX_STATUS", "HAS_REGISTRATION",
  "HAS_CONTRACT", "HAS_INVOICE", "INVOLVED_IN", "SANCTIONED_BY",
  "LICENSED_BY", "PERMITTED_BY",
  "OWNS_VEHICLE", "HAS_LICENSE_PLATE", "HAS_VIN", "OWNS_PROPERTY",
  "HAS_BANK_ACCOUNT", "HAS_WALLET", "SENT_TRANSACTION", "RECEIVED_TRANSACTION",
  "HOSTS", "RESOLVES_TO", "POINTS_TO", "USES_TECHNOLOGY",
  "HAS_OPEN_PORT", "RUNS_SERVICE", "HAS_DNS_RECORD", "USES_NAMESERVER",
  "USES_MX", "HAS_SSL_CERTIFICATE", "HOSTED_BY", "BELONGS_TO_ASN",
  "POSTED", "COMMENTED", "REACTED_TO", "MENTIONS", "HAS_HASHTAG",
  "CONTAINS_MEDIA", "CONTAINS_LINK", "AUTHORED_BY", "MEMBER_OF_GROUP",
  "OWNS_PAGE", "OWNS_CHANNEL",
  "HAS_EVIDENCE", "FOUND_IN_SOURCE", "SUPPORTED_BY", "EXTRACTED_FROM",
  "GENERATED_FROM", "CRAWLED_BY", "SCRAPED_FROM", "TAGGED_AS",
  "HAS_NOTE", "HAS_FINDING",
  "PART_OF_CASE", "PART_OF_INVESTIGATION", "HAS_TARGET", "HAS_HYPOTHESIS",
  "HAS_TIMELINE_EVENT", "HAS_REPORT", "HAS_TASK", "TRIGGERED_ALERT", "WATCHES",
  "GENERATED_BY_AI", "HAS_AI_INSIGHT", "HAS_EXTRACTION", "HAS_ENTITY_MENTION",
  "SUGGESTS_RELATIONSHIP", "HAS_SUMMARY", "HAS_RISK_SIGNAL",
] as const;

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [TramaNodeCategory, string][];

export interface LinkNodeResult {
  newNode: { type: TramaNodeType; label: string };
  relationship: { type: string; direction: "outgoing" | "incoming" };
}

interface LinkNodeDialogProps {
  anchorNode: GraphNodeResponse;
  onClose: () => void;
  onAdd: (result: LinkNodeResult) => Promise<void>;
}

export function LinkNodeDialog({ anchorNode, onClose, onAdd }: LinkNodeDialogProps) {
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<TramaNodeCategory>("identity");
  const [type, setType] = useState<TramaNodeType>(TRAMA_NODE_CATEGORIES["identity"][0] as TramaNodeType);
  const [relType, setRelType] = useState<string>("RELATED_TO");
  const [direction, setDirection] = useState<"outgoing" | "incoming">("outgoing");
  const [saving, setSaving] = useState(false);

  function handleCategoryChange(cat: TramaNodeCategory) {
    setCategory(cat);
    setType(TRAMA_NODE_CATEGORIES[cat][0] as TramaNodeType);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    try {
      await onAdd({ newNode: { type, label: label.trim() }, relationship: { type: relType, direction } });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const fromLabel = direction === "outgoing" ? anchorNode.label : label.trim() || "New node";
  const toLabel   = direction === "outgoing" ? label.trim() || "New node" : anchorNode.label;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-96 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-5">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">Add & Link Node</h2>
        <p className="text-xs text-zinc-400 mb-4">Create a new node and connect it to <span className="font-medium text-zinc-600 dark:text-zinc-300">{anchorNode.label}</span>.</p>

        {/* Relationship preview */}
        <div className="flex items-center gap-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2 mb-4 text-xs">
          <span className="truncate flex-1 text-right font-medium text-zinc-600 dark:text-zinc-300">{fromLabel}</span>
          <span className="text-zinc-400 flex-shrink-0 font-mono text-[10px] bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded">{relType}</span>
          <span className="text-zinc-400 flex-shrink-0">→</span>
          <span className="truncate flex-1 font-medium text-zinc-600 dark:text-zinc-300">{toLabel}</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* New node section */}
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">New Node</p>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Label</label>
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Node label…"
              className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Category</label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as TramaNodeCategory)}
                className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
              >
                {CATEGORIES.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TramaNodeType)}
                className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
              >
                {(TRAMA_NODE_CATEGORIES[category] as readonly string[]).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Relationship section */}
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 pt-1">Relationship</p>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Type</label>
            <select
              value={relType}
              onChange={(e) => setRelType(e.target.value)}
              className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
            >
              {RELATIONSHIP_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Direction</label>
            <div className="flex rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setDirection("outgoing")}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${direction === "outgoing" ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}
              >
                {anchorNode.label} → New
              </button>
              <div className="w-px bg-zinc-200 dark:bg-zinc-700" />
              <button
                type="button"
                onClick={() => setDirection("incoming")}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${direction === "incoming" ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}
              >
                New → {anchorNode.label}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!label.trim() || saving}
              className="rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Creating…" : "Add & Link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
