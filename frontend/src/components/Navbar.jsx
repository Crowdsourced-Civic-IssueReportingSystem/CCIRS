import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Home" },
  { to: "/report", label: "Report Issue" },
  { to: "/track", label: "Track" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/admin", label: "Transparency" },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const baseLinks = links;

  const authLinks = user
    ? [{ to: "/profile", label: "Profile" }]
    : [
        { to: "/login", label: "Login" },
        { to: "/register", label: "Register" },
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="text-lg font-extrabold text-primary">
          CCIRS
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {[...baseLinks, ...authLinks].map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-soft px-3 py-2 text-sm font-medium transition ${isActive ? "bg-blue-50 text-primary" : "text-slate-600 hover:bg-slate-100"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button
          className="inline-flex rounded-soft border border-slate-300 p-2 md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-slate-200 bg-white px-4 py-2 md:hidden">
          <div className="flex flex-col gap-1">
            {[...baseLinks, ...authLinks].map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-soft px-3 py-2 text-sm font-medium transition ${isActive ? "bg-blue-50 text-primary" : "text-slate-700 hover:bg-slate-100"}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

export default Navbar;
