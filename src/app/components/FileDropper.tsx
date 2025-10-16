import React, { useState, useCallback } from "react";
import { useHfTokens } from "@/app/handlers/tokenhandler";

export default function DatasetDropper({ hfToken }: { hfToken: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles((activeFiles) => [...activeFiles, ...droppedFiles]); // append new files
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleRemove = (fileName: string) => {
    setFiles((activeFiles) => activeFiles.filter((f) => f.name !== fileName));
  };

  const handleConsume = async () => {
  if (files.length === 0) return;

  setLoading(true);
  const formData = new FormData();

  // Append files
  files.forEach((file) => formData.append("files", file));

  // Append HF token from activeToken
  formData.append("hfToken", hfToken);

  try {
    const res = await fetch("http://localhost:8000/llm/consume", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const data = await res.json();
    console.log("Consume response:", data);
    alert(`Successfully ingested: ${data.files_ingested.join(", ")}`);
  } catch (err) {
    console.error(err);
    alert("Failed to consume files");
  } finally {
    setLoading(false);
  }
};

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-500 rounded p-4 text-gray-500"
    >
      {files.length === 0 ? (
        <p>Drag & drop files here</p>
      ) : (
        <ul className="text-sm text-white space-y-1 w-full">
          {files.map((f) => (
            <li key={f.name} className="flex justify-between items-center px-2">
              <span>{f.name}</span>
              <button
                onClick={() => handleRemove(f.name)}
                className="ml-2 text-red-500 hover:text-red-400 font-bold"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={handleConsume}
        disabled={files.length === 0 || loading}
        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded"
      >
        {loading ? "Consuming..." : "Consume"}
      </button>
    </div>
  );
}