"use client";

import Image from "next/image";
import ModelExplorer from "./components/Search";
import { motion, easeOut } from "framer-motion";
import AuraBackground7 from "./components/background7";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: easeOut },
  }),
};

export default function Home() {
  return (
    <div
      className="bg-gray-800/70 grid grid-rows-[5vh_1fr_5vh] items-center justify-items-center min-h-screen pb-[10vh] gap-[5vh]"
    >
      <AuraBackground7 />
      <div className="flex flex-col gap-[4vh] row-start-2 items-center w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-7xl font-semibold text-white w-full flex items-center justify-center whitespace-nowrap ml-18">
            {" "}
            <svg
              width="auto"
              height="90"
              viewBox="0 0 400 80"
              className="inline align-middle"
            >
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#d600b2ff" />
                  <stop offset="100%" stopColor="#0228ffff" />
                </linearGradient>
              </defs>
              <text
                x="40"
                y="64"
                fontSize="68"
                fontWeight="bold"
                fill="url(#grad1)"
              >
                Axon
              </text>
            </svg>
          </h1>
        </motion.div>

        <motion.ol
          className="font-mono list-inside list-decimal text-[clamp(0.8rem,2vw,1rem)] text-center leading-snug sm:text-left"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <motion.li
            className="mb-2 tracking-tight"
            custom={1}
            variants={fadeIn}
          >
            Get started by editing{" "}
           
            
          </motion.li>
          <motion.li className="tracking-tight" custom={2} variants={fadeIn}>
            Save and see your changes instantly.
          </motion.li>
        </motion.ol>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          custom={3}
        >
          
        </motion.div>

        <ModelExplorer />

        <motion.div
          className="flex gap-[2vh] items-center justify-center flex-col sm:flex-row w-full"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          custom={4}
        >
          <a
            className="rounded-full border border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-[clamp(0.875rem,2vw,1rem)] h-[6vh] min-h-[42px] px-[6vw] max-w-[400px] w-full sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logo"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-[clamp(0.875rem,2vw,1rem)] h-[6vh] min-h-[42px] px-[6vw] max-w-[400px] w-full sm:w-auto"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </motion.div>
      </div>

      <motion.footer
        className="row-start-3 flex gap-[2vw] flex-wrap items-center justify-center text-[clamp(0.8rem,1.5vw,0.95rem)]"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        custom={5}
      >
        {[
          {
            href: "https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app",
            label: "Learn",
            icon: "/file.svg",
          },
          {
            href: "https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app",
            label: "Examples",
            icon: "/window.svg",
          },
          {
            href: "https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app",
            label: "Go to nextjs.org →",
            icon: "/globe.svg",
          },
        ].map(({ href, label, icon }, i) => (
          <motion.a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            custom={i + 6}
            variants={fadeIn}
          >
            <Image
              aria-hidden
              src={icon}
              alt={`${label} icon`}
              width={16}
              height={16}
            />
            {label}
          </motion.a>
        ))}
      </motion.footer>
    </div>
  );
}
