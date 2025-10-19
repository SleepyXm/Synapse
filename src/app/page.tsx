"use client";

import ModelExplorer from "./components/Search";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div
      className="grid grid-rows-[5vh_1fr_5vh] items-center justify-items-center min-h-screen pb-[10vh] gap-[5vh]"
    >
      <div className="flex flex-col gap-[4vh] row-start-2 items-center w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-7xl font-semibold text-white w-full flex items-center justify-center whitespace-nowrap ml-0">
            {" "}
            <svg
              width="auto"
              height="90"
              viewBox="0 0 400 80"
              className="inline align-middle"
            >
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#74d4cfff" />
                  <stop offset="100%" stopColor="#7edd7eff" />
                </linearGradient>
              </defs>
              <text
                x="0"
                y="60"
                fontSize="68"
                fontWeight="200"
                fill="url(#grad1)"
              >
                Synapse
              </text>
            </svg>
          </h1>
        </motion.div>

        <div className="mt-[-16] mr-16">
          Control your Intelligence.
        </div>

        <ModelExplorer />
      </div>
    </div>
  );
}
