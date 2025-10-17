"use client";
import UnicornScene from "unicornstudio-react";

export default function AuraBackground1() {
  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden">
      <div className="absolute inset-0 w-full h-full">
      <UnicornScene
        projectId="5UmJmFVVxnDOIkdUYRnh" // your project ID from the snippet
        width="100%"   // makes it full width
        height="100%"
        fps={30}  // makes it fill container height
        production={true}
      />
      </div>
    </div>
  );
}

// cqcLtDwfoHqqRPttBbQE