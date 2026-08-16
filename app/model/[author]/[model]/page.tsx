"use client";

import Chat from "@/app/components/Chat";
import Conversation from "@/app/components/Conversations";
import { DEFAULT_MODEL_SETTINGS } from "@/app/hooks/interactive";
import Tooling from "@/app/components/Tooling";
import { useState } from "react";

export default function ChatPage() {
  const [settings, setSettings] = useState(DEFAULT_MODEL_SETTINGS);

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
        <Chat settings={settings}/> 
        
        <Tooling settings={settings} setSettings={setSettings} />
      </div>
    )
  }
