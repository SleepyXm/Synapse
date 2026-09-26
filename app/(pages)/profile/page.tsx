"use client";

import { useEffect, useState } from "react";
import { logout } from "@/app/components/handlers/auth";
import { addHfToken, deleteHfToken } from "@/app/components/handlers/tokens";
import { useUser } from "@/app/components/provider/UserProvider";
import { Button, Input, PropertyRow, Surface } from "@/app/UI";

const profileTabs = [
  ["account", "Account Info"],
  ["models", "Models"],
  ["sessions", "Sessions"],
  ["billing", "Billing"],
  ["data", "Data"],
  ["personalization", "Personalization"],
] as const;

type ProfileTab = (typeof profileTabs)[number][0];

export default function Profile() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("account");
  const { user } = useUser();
  const [hfTokenNames, setHfTokenNames] = useState<string[]>([]);
  const [newTokenName, setNewTokenName] = useState("");
  const [newTokenValue, setNewTokenValue] = useState("");
  const [, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (user?.hf_token_names) setHfTokenNames(user.hf_token_names);
  }, [user?.hf_token_names]);

  if (!hydrated) return null;
  if (!user) return <div>Loading...</div>;

  const activeLabel = activeTab === "account"
    ? "Account Information"
    : profileTabs.find(([id]) => id === activeTab)?.[1] ?? "Account Information";

  return (
    <main className="min-h-screen flex justify-center items-start pt-[10vh] relative">
      <Surface
        width="80%"
        height="85vh"
        opacity={0.35}
        borderOpacity={0.1}
        blur="md"
        radius="1rem"
        padding="1.5rem"
        shadow
        className="flex gap-6"
      >
        <aside className="w-48 flex flex-col items-center border-r border-white/10 pr-4 gap-6">
          <div className="flex flex-col items-center">
            <Surface tone="light" opacity={0.1} width="4rem" height="4rem" radius="999px" className="flex items-center justify-center text-xl font-medium text-white">
              {user.username ? user.username[0].toUpperCase() : "?"}
            </Surface>
            <div className="text-white text-sm mt-1">{user.username}</div>
          </div>

          <nav className="flex flex-col w-full gap-2">
            {profileTabs.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`w-full px-4 py-2 text-left rounded-md ${
                  activeTab === id
                    ? "bg-white/10 text-white font-semibold"
                    : "text-white/50 hover:bg-white/5"
                }`}
                onClick={() => setActiveTab(id)}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex flex-col gap-2 mt-auto w-full">
            <a href="/settings" className="w-full px-3 py-2 rounded-lg bg-white/5 text-white border border-white/10 text-center">Settings</a>
            <Button variant="danger" fullWidth padding="0.5rem 0.75rem" onClick={() => void logout()}>Log out</Button>
          </div>
        </aside>

        <section className="flex-1 overflow-auto flex flex-col gap-4 text-white">
          <h2 className="text-3xl font-semibold text-white mt-6">{activeLabel}</h2>

          {activeTab === "account" ? (
            <AccountDetails
              username={user.username}
              hfTokenNames={hfTokenNames}
              newTokenName={newTokenName}
              newTokenValue={newTokenValue}
              setNewTokenName={setNewTokenName}
              setNewTokenValue={setNewTokenValue}
              setHfTokenNames={setHfTokenNames}
              setError={setError}
            />
          ) : (
            <ProfileSummary username={user.username} hfTokenNames={user.hf_token_names} />
          )}
        </section>
      </Surface>
    </main>
  );
}

type AccountDetailsProps = {
  username: string;
  hfTokenNames: string[];
  newTokenName: string;
  newTokenValue: string;
  setNewTokenName: (value: string) => void;
  setNewTokenValue: (value: string) => void;
  setHfTokenNames: React.Dispatch<React.SetStateAction<string[]>>;
  setError: (value: string) => void;
};

function AccountDetails(props: AccountDetailsProps) {
  const removeToken = async (name: string) => {
    try {
      await deleteHfToken(name);
      props.setHfTokenNames((current) => current.filter((token) => token !== name));
    } catch (error) {
      props.setError(error instanceof Error ? error.message : "Failed to delete token");
    }
  };

  const addToken = async () => {
    if (!props.newTokenName.trim() || !props.newTokenValue.trim()) return;
    try {
      await addHfToken(props.newTokenName, props.newTokenValue);
      props.setHfTokenNames((current) => [...current, props.newTokenName]);
      props.setNewTokenName("");
      props.setNewTokenValue("");
    } catch (error) {
      props.setError(error instanceof Error ? error.message : "Failed to add token");
    }
  };

  return (
    <>
      <PropertyRow className="mt-[2%]"><span className="font-medium">Username:</span><span>{props.username}</span></PropertyRow>
      <PropertyRow><span className="font-medium">Password:</span><span className="tracking-widest">••••••••</span></PropertyRow>
      <PropertyRow><span className="font-medium">Email:</span></PropertyRow>

      <Surface tone="light" opacity={0.05} radius="0.375rem" padding="0.75rem" className="flex flex-col gap-2 mt-4">
        <span className="font-medium">HF Tokens:</span>
        <div className="flex flex-col gap-1 max-w-full">
          {props.hfTokenNames.length ? props.hfTokenNames.map((name) => (
            <Surface key={name} tone="light" opacity={0.1} radius="0.375rem" padding="0.25rem" className="flex items-center justify-between">
              <span className="truncate text-sm">{name}</span>
              <button type="button" onClick={() => void removeToken(name)} className="text-red-500 hover:text-red-600 text-sm">Delete</button>
            </Surface>
          )) : <em className="text-gray-500 text-sm">No HF Tokens added</em>}
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <Input tone="light" opacity={0.1} radius="0.375rem" padding="0.25rem" focus="ring" focusWidth={1} focusOpacity={1} value={props.newTokenName} onChange={(event) => props.setNewTokenName(event.target.value)} placeholder="Token name (e.g. personal)" className="text-sm" />
          <div className="flex items-center gap-2">
            <Input type="password" tone="light" opacity={0.1} radius="0.375rem" padding="0.25rem" focus="ring" focusWidth={1} focusOpacity={1} fullWidth={false} value={props.newTokenValue} onChange={(event) => props.setNewTokenValue(event.target.value)} placeholder="hf_..." className="flex-1 text-sm" />
            <button type="button" onClick={() => void addToken()} className="bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded-md text-white text-sm">Add</button>
          </div>
        </div>
      </Surface>
    </>
  );
}

function ProfileSummary({ username, hfTokenNames }: { username: string; hfTokenNames: string[] }) {
  return (
    <>
      <PropertyRow className="mt-[2%]"><span className="font-medium">Username:</span><span>{username}</span></PropertyRow>
      <PropertyRow><span className="font-medium">Password:</span><span className="tracking-widest">••••••••</span></PropertyRow>
      <PropertyRow><span className="font-medium">Email:</span></PropertyRow>
      <PropertyRow><span className="font-medium">HF Token:</span><span className="truncate max-w-[60%]">{hfTokenNames}</span></PropertyRow>
    </>
  );
}
