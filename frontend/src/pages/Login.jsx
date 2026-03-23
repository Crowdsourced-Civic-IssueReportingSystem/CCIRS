import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function Login() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { login, authBusy } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      const loggedInUser = await login({ email, password });
      showToast("Logged in successfully", "success");
      const isAdmin = String(loggedInUser?.role || "").toUpperCase() === "ADMIN";
      navigate(isAdmin ? "/admin" : "/");
    } catch (error) {
      showToast(error.message || "Login failed", "error");
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="panel p-6">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="mt-1 text-sm text-slate-600">Sign in to report and track your issues.</p>
        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-soft border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-soft border px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={authBusy}>
            {authBusy ? "Signing in..." : "Login"}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          New user?{" "}
          <Link to="/register" className="font-semibold text-primary hover:text-blue-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
