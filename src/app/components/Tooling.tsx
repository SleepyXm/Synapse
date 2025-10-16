import DatasetDropper from "./FileDropper";

export default function Tooling({ hfToken }: { hfToken: string }) {
    return (
        <div className="absolute left-[calc(50%+15vw)] rounded-2xl border border-white/10 bg-black/60 backdrop-blur p-4 shadow-2xl flex flex-col w-[25vw] h-[80vh] mt-16">
          <h3 className="text-lg font-bold text-white text-center mb-4">Tools</h3>
          <div className="flex flex-col gap-3 flex-1">

            <div className="flex-1 rounded-xl bg-black/30 text-white cursor-pointer flex flex-col">
              <div className="p-2 text-sm font-semibold border-b border-white/10 text-center">
                Datasets / Docs
              </div>
              <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">
                <DatasetDropper hfToken={hfToken} />
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