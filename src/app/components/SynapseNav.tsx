"use client";
import { useState } from "react";
import { useUser } from "../handlers/UserProvider";
import { logout } from "../types/auth";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const { user, setUser } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    setUser(null);
    router.push("/")
  };

  const links = [
    { label: "Home", url: "/" },
    { label: "Guide", url: "/Bullshit" },
    { label: "Stuff", url: "/alsobullshit" },
    ...(user
      ? [
        {
          label: "Profile",
          url: "/Profile"
        },
          {
            label: "Sign out", onClick: handleLogout,
          },
        ]
      : [
          { label: "Sign in", url: "/login", },
        ]),
  ];
  // Desktop links

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-black/60 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-5 flex items-center justify-between">
        {/* Logo */}
        <a href="" className="flex items-center gap-3">
          <svg
            width="36"
            height="36"
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16.2932 11.9774C16.1759 9.03514 18.1298 4.66446 18.1298 4.66446C15.4936 4.64047 12.9105 5.40303 10.718 6.82939L10.7286 6.83318C9.57413 9.97876 9.03203 12.5087 9.30055 16.1502C9.57132 19.8221 12.8069 24.2667 12.8069 24.2667L12.8151 24.289C13.2392 24.0337 13.6347 23.7625 13.9746 23.4789C16.0131 21.7779 18.0004 18.0004 18.0004 18.0004C18.0004 18.0004 16.3906 14.4202 16.2932 11.9774Z"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="text-sm font-semibold text-white w-full flex items-center justify-center whitespace-nowrap">
            {" "}
            <svg
              width="auto"
              height="20"
              viewBox="0 0 400 80"
              className="inline align-middle"
            >
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8cd4d0ff" />
                  <stop offset="100%" stopColor="#8bcc8bff" />
                </linearGradient>
              </defs>
              <text
                x="0"
                y="60"
                fontSize="84"
                fontWeight="200"
                fill="url(#grad1)"
              >
                Synapse
              </text>
            </svg>
          </div>
        </a>

        {/* Desktop Links */}
        <nav>
          <ul className="hidden md:flex items-center gap-1 text-sm font-medium text-white/60">
            {links.map((link) => (
              <li key={link.label}>
                {link.url ? (
                  <a
                    href={link.url}
                    className="hover:text-black transition-colors duration-300 px-4 py-2 rounded-full hover:bg-teal-300"
                  >
                    {link.label}
                  </a>
                ) : (
                  <button
                    onClick={link.onClick}
                    className="hover:text-black transition-colors duration-300 px-4 py-2 rounded-full hover:bg-teal-300"
                  >
                    {link.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md bg-white/5 ring-1 ring-white/10"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-white"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Mobile Menu */}
        {mobileOpen && (
          <ul className="absolute top-full left-0 w-full bg-neutral-900/70 ring-1 ring-white/10 backdrop-blur p-4 md:hidden flex flex-col gap-2 text-sm font-medium text-white/60">
            {links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.url}
                  className="w-full text-left hover:text-white transition-colors duration-300 px-4 py-2 rounded-full hover:bg-white/5 "
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  );
};

export default Navbar;
