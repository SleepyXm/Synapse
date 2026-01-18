"use client";
import { useState } from "react";
import DatasetDropper from "./FileDropper";

export default function Tooling() {
  const [showTooling, setShowTooling] = useState(true);

    return (
        <div className={`md:flex flex-col bg-black/60 backdrop-blur p-2 shadow-2xl
    transition-all duration-300 h-[94vh] mt-20
    ${showTooling ? "w-[25vw]" : "w-0 overflow-hidden"}`}>
            <button
        className="absolute top-3 px-2 py-1 right-[0.8rem] bg-teal-500 text-white rounded hover:bg-teal-400 transition"
        onClick={() => setShowTooling(!showTooling)}
      >
        {showTooling ? "Hide" : "Show"}
      </button>
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