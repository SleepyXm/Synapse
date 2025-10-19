"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup, login } from "@/app/types/auth";
import { useUser } from "../handlers/UserProvider";


export default function Auth() {
  const { setUser } = useUser();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
  try {
    if (isSignUp) {
      if (password !== password2) {
        alert("Passwords do not match!");
        return; // stop execution
      }

      const res = await signup(userName, password);
      console.log("Signed up:", res.message);
    } else {
      const res = await login(userName, password);
      setUser(res);
      console.log("Logged in token:", res.token);
      router.push("/");
    }
  } catch (err) {
    console.error(err);
  }
}
  return (
    <div className="grid grid-rows-[5vh_1fr_5vh] items-center justify-items-center min-h-screen gap-[5vh]">
  <div className="flex flex-col row-start-2 items-center w-[85vw] mt-8 sm:mt-12 lg:w-[20vw]">
    <div className="relative w-full max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-1000 mx-auto">
      <section className="order-1 lg:order-2 relative">
  <div className="group relative w-full h-full">

    <div className="absolute inset-0 rounded-2xl overflow-hidden">
      <div className="pointer-events-none absolute -inset-10 rounded-full bg-gradient-to-r from-transparent via-gray-400/20 to-transparent blur-xl opacity-50 animate-spin [animation-duration:10s]"></div>
      <div className="pointer-events-none absolute -inset-20 rounded-full bg-gradient-to-r from-transparent via-gray-500/15 to-transparent blur-2xl opacity-30 animate-spin [animation-duration:18s] [animation-direction:reverse]"></div>
    </div>


    <div className="absolute inset-0 rounded-2xl p-px bg-gradient-to-b from-gray-300/40 via-gray-600/60 to-gray-800/50 transition-opacity duration-300 group-hover:opacity-100"></div>


    <div
      className="relative h-full overflow-hidden ring-1 ring-white/15 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:ring-gray-400/30 hover:shadow-[0_10px_40px_-10px_rgba(107,114,128,0.4)] rounded-2xl shadow-inner"
      style={{
        backgroundColor: "hsl(220, 13%, 9%)",
        backgroundImage: `
          radial-gradient(at 88% 40%, hsl(220, 13%, 9%) 0px, transparent 85%),
          radial-gradient(at 49% 30%, hsl(220, 13%, 9%) 0px, transparent 85%),
          radial-gradient(at 14% 26%, hsl(220, 13%, 9%) 0px, transparent 85%),
          radial-gradient(at 0% 64%, hsl(220, 9%, 46%) 0px, transparent 85%),
          radial-gradient(at 41% 94%, hsl(215, 14%, 34%) 0px, transparent 85%),
          radial-gradient(at 100% 99%, hsl(217, 19%, 27%) 0px, transparent 85%)
        `,
      }}
    >
      <div className="relative sm:p-8 lg:p-10 flex flex-col h-full pt-6 pr-6 pb-6 pl-6">

        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80"></span>
            <span>Secure area</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            {isSignUp ? "Create your account" : "Sign in"}
          </h2>
          <p className="text-sm text-gray-400 mt-1.5">
            {isSignUp
              ? "Enter your username and password to create an account."
              : "Use your username and password to sign in."}
          </p>
        </div>


        <form
          id="login-form"
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >

          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <input
                type="text"
                required
                placeholder="Enter your username"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all duration-300"
              />
            </div>
          </div>


          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <a
                href="#"
                className="text-xs text-gray-400 hover:text-teal-300 hover: transtion-all ease-in-out duration-200"
              >
                Forgot your Password?
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all duration-300"
              />
            </div>
          </div>

          {/* Re-enter password for Sign Up */}
          {isSignUp && (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Re-enter Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <input
                  type="password"
                  required
                  placeholder="Re-enter your password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all duration-300"
                />
              </div>
            </div>
          )}

          {/* Options */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" className="sr-only peer" />
              <span className="h-4 w-4 rounded-md ring-1 ring-gray-600/40 bg-gray-900/50 flex items-center justify-center peer-checked:bg-gray-200 peer-checked:ring-gray-200 transition">
                <svg
                  className="h-3 w-3 text-gray-900 opacity-0 peer-checked:opacity-100 transition"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              </span>
              <span className="text-xs text-gray-300">Remember me</span>
            </label>
            <a
              href="#"
              className="text-xs text-gray-400 hover:text-teal-300"
            >
              Trouble signing in?
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full inline-flex gap-2 shadow-[inset_0_-2px_25px_-4px_rgba(255,255,255,0.2)] ring-1 ring-white/10 hover:ring-gray-300/40 hover:from-gray-600 hover:to-gray-500 hover:shadow-lg transition-all duration-300 focus:outline-none text-sm font-medium text-white bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg pt-2.5 pr-4 pb-2.5 pl-4 items-center justify-center"
          >
            Sign {isSignUp ? "Up" : "In"}
          </button>

          {/* Divider and Provider button */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-transparent px-2 text-[10px] uppercase tracking-wide text-gray-500">
                or
              </span>
            </div>
          </div>

          <button
            type="button"
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-800/60 ring-1 ring-gray-600/30 hover:bg-gray-700/60 hover:text-white hover:ring-gray-500/40 transition-all duration-300 focus:outline-none"
          >
            <svg
              className="h-4 w-4"
              fill="currentColor"
              viewBox="0 0 24 24"
              stroke="none"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
            </svg>
            (Coming soon)
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <p>
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-gray-300 hover:text-teal-300"
              >
                {isSignUp ? "Log In" : "Sign Up"}
              </button>
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="hover:text-white transition">
                Terms
              </a>
              <span className="text-gray-600">•</span>
              <a href="#" className="hover:text-white transition">
                Privacy
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
    </div>
  </div>
</div>
  );
}
