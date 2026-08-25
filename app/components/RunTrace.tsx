import type { RunTraceState } from "@/app/handlers/runs";

export default function RunTrace({ trace }: { trace: RunTraceState }) {
  if (trace.status === "idle") return null;
  return (
    <section className="mx-2 mb-2 rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/65">
      <div className="flex items-center justify-between gap-2">
        <span>
          {trace.activeTool
            ? "Searching the knowledge network…"
            : trace.status === "failed"
              ? "Run failed"
              : trace.status === "completed"
                ? "Knowledge run completed"
                : "Model run in progress…"}
        </span>
        {trace.runID && <span className="font-mono text-[10px] text-white/35">{trace.runID.slice(0, 8)}</span>}
      </div>
      {trace.failure && <p className="mt-2 text-red-300">{trace.failure}</p>}
      {trace.evidence.length > 0 && (
        <div className="mt-3 grid gap-2">
          {trace.evidence.map((item, index) => (
            <details key={`${item.citation_id}:${item.knowledge_base_id}:${index}`} className="rounded-lg border border-white/10 bg-white/5 p-2">
              <summary className="cursor-pointer text-white/85">
                {item.filename}{item.page ? ` · page ${item.page}` : ""} · {Math.round(item.score * 100)}%
              </summary>
              <p className="mt-2 whitespace-pre-wrap text-white/60">{item.content}</p>
              <p className="mt-2 font-mono text-[10px] text-white/35">{item.citation_id}</p>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
