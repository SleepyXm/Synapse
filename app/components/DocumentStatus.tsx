import type { KnowledgeDocument } from "@/app/handlers/knowledge";

const statusColour: Record<KnowledgeDocument["status"], string> = {
  queued: "bg-amber-400/15 text-amber-200",
  processing: "bg-blue-400/15 text-blue-200",
  ready: "bg-emerald-400/15 text-emerald-200",
  failed: "bg-red-400/15 text-red-200",
};

export default function DocumentStatus({ document }: { document: KnowledgeDocument }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <span className="truncate text-sm text-white">{document.filename}</span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] ${statusColour[document.status]}`}>
          {document.status}
        </span>
      </div>
      {document.failure_reason && <p className="mt-1 text-xs text-red-300">{document.failure_reason}</p>}
    </div>
  );
}
