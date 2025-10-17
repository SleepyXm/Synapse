import DatasetDropper from "./FileDropper";

export default function Tooling() {
    return (
        <div className="absolute left-[calc(50%+25vw)] bg-black/60 backdrop-blur p-4 flex flex-col w-[25vw] h-[92vh] mt-20">
          <h3 className="text-lg font-bold text-white text-center mb-4">Tools</h3>
          <div className="flex flex-col gap-3 flex-1">

            <div className="flex-1 rounded-xl bg-black/30 text-white cursor-pointer flex flex-col">
              <div className="p-2 text-sm font-semibold border-b border-white/10 text-center">
                Datasets / Docs
              </div>
              <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">
                <DatasetDropper />
              </div>
            </div>


            {/* Vector DB */}
            <div className="flex-1 rounded-xl bg-black/30 text-white cursor-pointer hover:bg-white/10 transition flex flex-col">
              <div className="p-2 text-sm font-semibold border-b border-white/10 text-center">
                Vector DB
              </div>
              <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">
                Empty
              </div>
            </div>

            {/* RAG Pipelines */}
            <div className="flex-1 rounded-xl bg-black/30 text-white cursor-pointer hover:bg-white/10 transition flex flex-col">
              <div className="p-2 text-sm font-semibold border-b border-white/10 text-center">
                RAG Pipeline(s)
              </div>
              <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">
                Empty
              </div>
            </div>

            {/* Agentic System */}
            <div className="flex-1 rounded-xl bg-black/30 text-white cursor-pointer hover:bg-white/10 transition flex flex-col">
              <div className="p-2 text-sm font-semibold border-b border-white/10 text-center">
                Agentic System
              </div>
              <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">
                Empty
              </div>
            </div>
          </div>
        </div>
    );
}