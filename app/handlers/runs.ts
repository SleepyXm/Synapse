import type { KnowledgeSearchResult } from "@/app/handlers/knowledge";

export type RunEvent = {
  type: "run.started" | "tool.started" | "tool.completed" | "assistant.delta" | "run.completed" | "run.failed";
  data: Record<string, unknown>;
};

export type RunTraceState = {
  status: "idle" | "running" | "completed" | "failed";
  runID?: string;
  activeTool?: string;
  evidence: KnowledgeSearchResult[];
  failure?: string;
};

export const EMPTY_RUN_TRACE: RunTraceState = { status: "idle", evidence: [] };

function parseEventBlock(block: string): RunEvent | null {
  let type = "";
  const dataLines: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) type = line.slice(6).trim();
    if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
  }
  if (!type || dataLines.length === 0) return null;
  const data = JSON.parse(dataLines.join("\n")) as Record<string, unknown>;
  return { type: type as RunEvent["type"], data };
}

export async function consumeRunStream(
  response: Response,
  onEvent: (event: RunEvent) => void,
): Promise<void> {
  if (!response.body) throw new Error("The server returned no event stream.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n");
    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      const block = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 2);
      if (block) {
        const event = parseEventBlock(block);
        if (event) onEvent(event);
      }
      boundary = buffer.indexOf("\n\n");
    }
    if (done) break;
  }

  if (buffer.trim()) {
    const event = parseEventBlock(buffer.trim());
    if (event) onEvent(event);
  }
}

export function reduceRunTrace(previous: RunTraceState, event: RunEvent): RunTraceState {
  switch (event.type) {
    case "run.started":
      return { status: "running", runID: String(event.data.run_id ?? ""), evidence: [] };
    case "tool.started":
      return { ...previous, status: "running", activeTool: String(event.data.tool ?? "knowledge.search") };
    case "tool.completed": {
      const citations = Array.isArray(event.data.citations)
        ? event.data.citations as KnowledgeSearchResult[]
        : [];
      return {
        ...previous,
        status: "running",
        activeTool: undefined,
        evidence: [...previous.evidence, ...citations],
      };
    }
    case "run.completed":
      return {
        ...previous,
        status: "completed",
        activeTool: undefined,
        evidence: Array.isArray(event.data.evidence)
          ? event.data.evidence as KnowledgeSearchResult[]
          : previous.evidence,
      };
    case "run.failed":
      return {
        ...previous,
        status: "failed",
        activeTool: undefined,
        failure: String(event.data.message ?? "The run failed."),
      };
    default:
      return previous;
  }
}
