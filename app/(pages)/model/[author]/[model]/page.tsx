"use client";

import Chat from "@/app/features/LLM/Chat";
import Conversation from "@/app/features/LLM/Conversations";
import { DEFAULT_MODEL_SETTINGS } from "@/app/components/hooks/interactive";
import Tooling from "@/app/features/LLM/Tooling";
import { useState } from "react";

export default function ChatPage() {
  const [settings, setSettings] = useState(DEFAULT_MODEL_SETTINGS);
  const [customisationId, setCustomisationId] = useState("default");

 return (
      <div
        className={[
          "flex",
          "items-center",
          "justify-center",
          "h-screen",
        ].join(" ")}
      >
        <Conversation />
        <Chat settings={settings} customisationId={customisationId}/>
        
        <Tooling
          settings={settings}
          setSettings={setSettings}
          customisationId={customisationId}
          setCustomisationId={setCustomisationId}
        />
      </div>
    )
  }
