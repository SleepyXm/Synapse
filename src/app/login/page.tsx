"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, easeOut, TargetAndTransition } from "framer-motion";
import { signup, login } from "@/app/types/auth";
import AuraBackground7 from "@/app/assets/background7";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: easeOut },
  }),
};

export default function Auth() {
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
      console.log("Logged in token:", res.token);
      router.push("/");
    }
  } catch (err) {
    console.error(err);
  }
}
  return (
    <div
      className="bg-gray-800/70 grid grid-rows-[5vh_1fr_5vh] items-center justify-items-center min-h-screen pb-[10vh] gap-[5vh]"
    >
      <AuraBackground7 />
      <div className="flex flex-col gap-[4vh] row-start-2 items-center w-full">
  <div className="relative w-full max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-1000 mx-auto">
    <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
      <div className="flex flex-col lg:flex-row min-w-[300] min-h-[800px]">
        <div className="flex-1 p-8 space-y-6">
          <div className="text-center space-y-2 animate-in fade-in slide-in-from-top-4 duration-700 delay-300">
            <div className="w-16 h-16 bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl mx-auto shadow-lg flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-8 h-8 text-white"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h1 className="text-4xl font-light text-white tracking-tight uppercase">
              Welcome back
            </h1>
            <p className="text-white/70 text-sm">Sign in to your account</p>
          </div>

          <form
            id="loginForm"
            className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90 block">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 text-white/50"
                  >
                    <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  </svg>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter your Username"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90 block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 text-white/50"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-300"
                />
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90 block">
                  Re-enter Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5 text-white/50"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <input
                    type="password"
                    name="password2"
                    required
                    placeholder="Re-enter your password"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-300"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-white/80">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="sr-only" />
                <div className="w-4 h-4 bg-white/20 border border-white/30 rounded flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    className="w-3 h-3 text-white hidden"
                  >
                    <path d="M20 6 9 17l-5-5"></path>
                  </svg>
                </div>
                <span>Remember me</span>
              </label>
              <a
                href="#"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 flex font-medium text-white bg-gradient-to-r from-slate-900 to-slate-700 rounded-xl py-3 px-4 shadow-lg items-center justify-center space-x-2"
            >
              <span>Sign in</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </button>
          </form>

          <div className="text-center text-sm text-white/70 mt-4">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-400 hover:underline ml-1"
            >
              {isSignUp ? "Log In" : "Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
        
    </div>
  );
}
