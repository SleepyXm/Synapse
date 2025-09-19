"use client";
import AuraBackground7 from "@/app/components/background7";
import { logout } from "@/app/components/auth";
import { useState } from "react";

type User = {
  username: string;
  password: string;
  hf_token: string;
  email?: string;
};

export default function Profile({ user }: { user: User | null }) {
  const [activeTab, setActiveTab] = useState("account");

  if (!user) return <div>Loading...</div>;

  const { username, password, hf_token, email } = user;

  return (
    <div className="bg-gray-800/70 min-h-screen flex justify-center items-start pt-[10vh] relative">
      <AuraBackground7 />
      <div className="w-[80%] h-[85vh] rounded-2xl border border-white/10 bg-black/60 backdrop-blur p-6 shadow-2xl flex gap-6">
        {/* Left sidebar */}
        <div className="w-48 flex flex-col items-center border-r border-white/10 pr-4 gap-6">
          {/* Profile picture */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-xl font-medium text-white">
              {username[0].toUpperCase()}
            </div>
            <div className="text-white text-sm mt-1">{username}</div>
          </div>

          {/* Tabs */}
          <div className="flex flex-col w-full gap-2">
            <button
              className={`w-full px-4 py-2 text-left rounded-md ${
                activeTab === "account"
                  ? "bg-white/10 text-white font-semibold"
                  : "text-white/50 hover:bg-white/5"
              }`}
              onClick={() => setActiveTab("account")}
            >
              Account Info
            </button>
            <button
              className={`w-full px-4 py-2 text-left rounded-md ${
                activeTab === "models"
                  ? "bg-white/10 text-white font-semibold"
                  : "text-white/50 hover:bg-white/5"
              }`}
              onClick={() => setActiveTab("models")}
            >
              Models
            </button>
            <button
              className={`w-full px-4 py-2 text-left rounded-md ${
                activeTab === "sessions"
                  ? "bg-white/10 text-white font-semibold"
                  : "text-white/50 hover:bg-white/5"
              }`}
              onClick={() => setActiveTab("sessions")}
            >
              Sessions
            </button>
            <button
              className={`w-full px-4 py-2 text-left rounded-md ${
                activeTab === "billing"
                  ? "bg-white/10 text-white font-semibold"
                  : "text-white/50 hover:bg-white/5"
              }`}
              onClick={() => setActiveTab("billing")}
            >
              Billing
            </button>
            <button
              className={`w-full px-4 py-2 text-left rounded-md ${
                activeTab === "data"
                  ? "bg-white/10 text-white font-semibold"
                  : "text-white/50 hover:bg-white/5"
              }`}
              onClick={() => setActiveTab("data")}
            >
              Data
            </button>

            <button
              className={`w-full px-4 py-2 text-left rounded-md ${
                activeTab === "personalization"
                  ? "bg-white/10 text-white font-semibold"
                  : "text-white/50 hover:bg-white/5"
              }`}
              onClick={() => setActiveTab("personalization")}
            >
              Personalization
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-auto w-full">
            <a
              href="/settings"
              className="w-full px-3 py-2 rounded-lg bg-white/5 text-white border border-white/10 text-center"
            >
              Settings
            </a>
            <button
              onClick={() => logout()}
              className="w-full px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-400 transition"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Right content area */}
        <div className="flex-1 overflow-auto flex flex-col gap-4 text-white">
          {activeTab === "account" && (
            <>
            <h2 className="text-3xl font-semibold text-white mt-6">Account Information</h2>
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md mt-[2%]">
                <span className="font-medium">Username:</span>
                <span>{username}</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md">
                <span className="font-medium">Password:</span>
                <span className="tracking-widest">••••••••</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md">
                <span className="font-medium">Email:</span>
                <span>{email || <em>Add your email</em>}</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md">
                <span className="font-medium">HF Token:</span>
                <span className="truncate max-w-[60%]">{hf_token}</span>
              </div>
            </>
          )}

          {activeTab === "models" && (
            <>
            <h2 className="text-3xl font-semibold text-white mt-6">Models</h2>
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md mt-[2%]">
                <span className="font-medium">Username:</span>
                <span>{username}</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md">
                <span className="font-medium">Password:</span>
                <span className="tracking-widest">••••••••</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md">
                <span className="font-medium">Email:</span>
                <span>{email || <em>Add your email</em>}</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md">
                <span className="font-medium">HF Token:</span>
                <span className="truncate max-w-[60%]">{hf_token}</span>
              </div>
            </>
          )}
          {activeTab === "sessions" && (
            <>
            <h2 className="text-3xl font-semibold text-white mt-6">Sessions</h2>
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md mt-[2%]">
                <span className="font-medium">Username:</span>
                <span>{username}</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md">
                <span className="font-medium">Password:</span>
                <span className="tracking-widest">••••••••</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md">
                <span className="font-medium">Email:</span>
                <span>{email || <em>Add your email</em>}</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md">
                <span className="font-medium">HF Token:</span>
                <span className="truncate max-w-[60%]">{hf_token}</span>
              </div>
            </>
          )}
          {activeTab === "billing" && (
            <>
            <h2 className="text-3xl font-semibold text-white mt-6">Billing</h2>
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md mt-[2%]">
                <span className="font-medium">Username:</span>
                <span>{username}</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md">
                <span className="font-medium">Password:</span>
                <span className="tracking-widest">••••••••</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md">
                <span className="font-medium">Email:</span>
                <span>{email || <em>Add your email</em>}</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md">
                <span className="font-medium">HF Token:</span>
                <span className="truncate max-w-[60%]">{hf_token}</span>
              </div>
            </>
          )}

          {activeTab === "data" && (
            <>
            <h2 className="text-3xl font-semibold text-white mt-6">Data</h2>
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md mt-[2%]">
                <span className="font-medium">Username:</span>
                <span>{username}</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md">
                <span className="font-medium">Password:</span>
                <span className="tracking-widest">••••••••</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md">
                <span className="font-medium">Email:</span>
                <span>{email || <em>Add your email</em>}</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md">
                <span className="font-medium">HF Token:</span>
                <span className="truncate max-w-[60%]">{hf_token}</span>
              </div>
            </>
          )}

          {activeTab === "personalization" && (
            <>
            <h2 className="text-3xl font-semibold text-white mt-6">Personalization</h2>
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md mt-[2%]">
                <span className="font-medium">Username:</span>
                <span>{username}</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md">
                <span className="font-medium">Password:</span>
                <span className="tracking-widest">••••••••</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md">
                <span className="font-medium">Email:</span>
                <span>{email || <em>Add your email</em>}</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md">
                <span className="font-medium">HF Token:</span>
                <span className="truncate max-w-[60%]">{hf_token}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
