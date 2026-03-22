import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function Profile() {
  const { user, updateProfile, logout, loginMock } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    language: user?.language || "English",
    notifications: Boolean(user?.notifications),
  });

  const onSubmit = (event) => {
    event.preventDefault();
    updateProfile(form);
    showToast("Profile updated successfully", "success");
  };

  const onLogout = () => {
    logout();
    showToast("Logged out", "warning");
    setTimeout(() => loginMock(), 1200);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="mt-1 text-sm text-slate-600">Manage your account details and communication preferences.</p>
      </header>

      <form onSubmit={onSubmit} className="panel space-y-4 p-5">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
            Full name
          </label>
          <input
            id="name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="w-full rounded-soft border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="w-full rounded-soft border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="language" className="mb-1 block text-sm font-medium text-slate-700">
            Language
          </label>
          <select
            id="language"
            value={form.language}
            onChange={(event) => setForm((prev) => ({ ...prev, language: event.target.value }))}
            className="w-full rounded-soft border px-3 py-2 text-sm"
          >
            {["English", "Hindi", "Kannada", "Tamil"].map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center justify-between rounded-soft border px-3 py-2">
          <span className="text-sm font-medium text-slate-700">Push notifications</span>
          <input
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={form.notifications}
            onChange={(event) => setForm((prev) => ({ ...prev, notifications: event.target.checked }))}
          />
        </label>

        <div className="flex flex-wrap gap-2 pt-2">
          <button type="submit" className="btn-primary">
            Save Profile
          </button>
          <button type="button" className="rounded-soft border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100" onClick={onLogout}>
            Logout
          </button>
        </div>
      </form>
    </div>
  );
}

export default Profile;
