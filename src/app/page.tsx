"use client";

import ModelExplorer from "./components/Search";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="grid min-h-screen grid-rows-[10fr_auto_1fr] place-items-center py-48">
      <div className="flex flex-col items-center gap-6 w-full px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="flex items-center justify-center">
            <svg
              viewBox="0 0 400 80"
              className="h-24 sm:h-16 md:h-28"
            >
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#74d4cfff" />
                  <stop offset="100%" stopColor="#7edd7eff" />
                </linearGradient>
              </defs>
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="68"
                fontWeight="200"
                fill="url(#grad1)"
              >
                Synapse
              </text>
            </svg>
          </h1>
        </motion.div>

        <p className="text-center text-white/80 text-base sm:text-lg">
          Control your Intelligence.
        </p>

        <ModelExplorer />
      </div>
    </div>
  );
}