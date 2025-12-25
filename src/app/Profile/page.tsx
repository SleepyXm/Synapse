"use client";
import { logout } from "@/app/types/auth";
import { useState, useEffect } from "react";
import { useUser } from "../handlers/UserProvider";
import { addHfToken, deleteHfToken } from "@/app/types/tokens";
//
export default function Profile() {
  const [activeTab, setActiveTab] = useState("account");
  const { user } = useUser();
  const [hfTokens, setHfTokens] = useState<string[]>([]);
  const [newToken, setNewToken] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (user?.hf_token) setHfTokens(user.hf_token);
  }, [user?.hf_token]);

  if (!hydrated) return null;
  if (!user) return <div>Loading...</div>;

  const { username, hf_token } = user;

  return (
    <div className="min-h-screen flex justify-center items-start pt-[10vh] relative">
      <div className="w-[80%] h-[85vh] rounded-2xl border border-white/10 bg-black/60 backdrop-blur p-6 shadow-2xl flex gap-6">
        <div className="w-48 flex flex-col items-center border-r border-white/10 pr-4 gap-6">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-xl font-medium text-white">
              {username ? username[0].toUpperCase() : "?"}
            </div>
            <div className="text-white text-sm mt-1">{username}</div>
          </div>

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

        <div className="flex-1 overflow-auto flex flex-col gap-4 text-white">
          {activeTab === "account" && (
            <>
              <h2 className="text-3xl font-semibold text-white mt-6">
                Account Information
              </h2>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md mt-[2%]">
                <span className="font-medium">Username:</span>
                <span>{user.username}</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md">
                <span className="font-medium">Password:</span>
                <span className="tracking-widest">••••••••</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md">
                <span className="font-medium">Email:</span>
                
              </div>

              <div className="flex flex-col bg-white/5 p-3 rounded-md gap-2 mt-4">
                <span className="font-medium">HF Tokens:</span>

                <div className="flex flex-col gap-1 max-w-[100%]">
                  {hfTokens.length ? (
                    hfTokens.map((token, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white/10 p-1 rounded-md"
                      >
                        <span className="truncate">{token}</span>
                        <button
                          onClick={() => {
                            deleteHfToken(token); // backend call
                            setHfTokens((prev) =>
                              prev.filter((t) => t !== token)
                            ); // update local state
                          }}
                          className="text-red-500 hover:text-red-600 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    ))
                  ) : (
                    <em>No HF Tokens added</em>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2 max-w-[100%]">
                  <input
                    type="text"
                    placeholder="Add your HF Token"
                    className="flex-1 bg-white/10 p-1 rounded-md text-white text-sm"
                    value={newToken}
                    onChange={(e) => setNewToken(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      if (!newToken.trim()) return;
                      addHfToken(newToken); // backend call
                      setHfTokens((prev) => [...prev, newToken]); // update local state
                      setNewToken(""); // clear input
                    }}
                    className="bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded-md text-white text-sm"
                  >
                    Add
                  </button>
                </div>
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
                
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md">
                <span className="font-medium">HF Token:</span>
                <span className="truncate max-w-[60%]">{hf_token}</span>
              </div>
            </>
          )}
          {activeTab === "sessions" && (
            <>
              <h2 className="text-3xl font-semibold text-white mt-6">
                Sessions
              </h2>
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
                 
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md">
                <span className="font-medium">HF Token:</span>
                <span className="truncate max-w-[60%]">{hf_token}</span>
              </div>
            </>
          )}
          {activeTab === "billing" && (
            <>
              <h2 className="text-3xl font-semibold text-white mt-6">
                Billing
              </h2>
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
                 
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-md">
                <span className="font-medium">HF Token:</span>
                <span className="truncate max-w-[60%]">{hf_token}</span>
              </div>
            </>
          )}

          {activeTab === "personalization" && (
            <>
              <h2 className="text-3xl font-semibold text-white mt-6">
                Personalization
              </h2>
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
