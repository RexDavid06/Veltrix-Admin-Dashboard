import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { apiErrorDetail } from "../api";
import { clearSession, saveSession, saveSessionUser, getSessionUser, hasSession } from "../auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (hasSession() && getSessionUser()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post("/api/auth/token/", { username: email.trim(), password });
      saveSession({ access: data.access, refresh: data.refresh });

      // Fetch the profile, then probe an admin endpoint so non-admin accounts
      // get a clear message here instead of empty 403 pages later.
      const profile = await api.get("/api/profile/");
      saveSessionUser(profile.data);
      try {
        await api.get("/api/admin/stats/");
      } catch {
        clearSession();
        setError("This account does not have admin access. Contact an administrator.");
        return;
      }
      navigate("/", { replace: true });
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 400) {
        setError("Invalid email or password.");
      } else {
        setError(apiErrorDetail(err));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <h1>Veltrix Admin</h1>
        <p className="subtitle">Sign in with an administrator account</p>
        {error && <div className="banner banner-error">{error}</div>}
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button className="btn btn-block" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
