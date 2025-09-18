"use client";
import { easeOut } from "framer-motion";
import AuraBackground7 from "@/app/components/background7";
import { logout } from "@/app/components/auth";

type User = {
  username: string;
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: easeOut },
  }),
};

export default function Profile({ user }: {user: User | null }) {
  if (!user) return <div>Loading...</div>;

  const { username } = user;

  return (
    <div className="bg-gray-800/70 grid grid-rows-[5vh_1fr_5vh] items-center justify-items-center min-h-screen pb-[10vh] gap-[5vh]">
      <AuraBackground7 />
      <div className="flex justify-center items-start w-full h-full mt-[11%]">
      <div className="w-[60%] md:w-[80%] h-[85vh] rounded-2xl border border-white/10 bg-black/60 backdrop-blur p-6 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-lg font-medium text-white">
                {username[0].toUpperCase()}
              </div>
              <div className="text-white text-sm mt-1">{username}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/settings"
              className="px-3 h-9 rounded-lg bg-white/5 text-white border border-white/10 flex items-center"
            >
              Settings
            </a>
            <button
              onClick={() => logout()}
              className="px-3 h-9 rounded-lg bg-red-500 text-white hover:bg-red-400 transition"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Optional shortcuts */}
        <div className="flex gap-2 flex-wrap">
          <a href="/models" className="px-3 py-1 rounded-md bg-white/5 text-sm text-white">My Models</a>
          <a href="/sessions" className="px-3 py-1 rounded-md bg-white/5 text-sm text-white">Sessions</a>
          <a href="/billing" className="px-3 py-1 rounded-md bg-white/5 text-sm text-white">Billing</a>
        </div>
      </div>
    </div>
    </div>
  );
}
