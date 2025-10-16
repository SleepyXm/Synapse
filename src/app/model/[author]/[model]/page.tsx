"use client";

import Chat from "@/app/components/Chat";
import Conversation from "@/app/components/Conversations";
import AuraBackground7 from "@/app/assets/background7";

export default function ChatPage() {
  

 return (
      <div
        className={[
          "flex",
          "items-center",
          "justify-center",
          "h-screen",
          "bg-gray-900/70",
          "p-4",
        ].join(" ")}
      >
        <AuraBackground7 />
        <Chat /> 
        <Conversation />
      </div>
    )
  }
