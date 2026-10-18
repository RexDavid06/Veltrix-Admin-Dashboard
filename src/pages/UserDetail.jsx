import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { apiErrorDetail } from "../api";
import StatusBadge from "../components/StatusBadge";
import { Banner, ErrorState, Loading } from "../components/States";

function Detail({ label, value }) {
  return (
    <div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/api/admin/users/${id}/`);
      setUser(response.data);
    } catch (err) {
      setError(apiErrorDetail(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(fields, message) {
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const response = await api.patch(`/api/admin/users/${id}/`, fields);
      setUser(response.data);
      setNotice(message);
    } catch (err) {
      setError(apiErrorDetail(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loading />;
  if (!user) return <ErrorState message={error || "User not found."} />;

  const name = `${user.first_name} ${user.last_name}`.trim() || "—";

  return (
    <>
      <Banner kind="error">{error}</Banner>
      {notice && <Banner kind="success">{notice}</Banner>}

      <div className="card card-pad">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "start" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>{name}</h2>
            <div style={{ color: "var(--text-muted)" }}>{user.email}</div>
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <StatusBadge value={user.role} />
              <StatusBadge value={user.is_verified} />
              <span className={`badge ${user.is_active ? "badge-green" : "badge-red"}`}>
                {user.is_active ? "Active" : "Disabled"}
              </span>
              {user.is_superuser && <span className="badge badge-amber">Superuser</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate("/users")}>
              Back to users
            </button>
            <button
              className="btn btn-sm"
              disabled={busy}
              onClick={() =>
                patch({ is_verified: !user.is_verified }, user.is_verified ? "Verification removed." : "Account marked verified.")
              }
            >
              {user.is_verified ? "Remove verification" : "Mark verified"}
            </button>
            {user.is_active ? (
              <button
                className="btn btn-danger btn-sm"
                disabled={busy}
                onClick={() => {
                  if (window.confirm(`Deactivate ${user.email}? They will no longer be able to sign in.`)) {
                    patch({ is_active: false }, "Account deactivated.");
                  }
                }}
              >
                Deactivate
              </button>
            ) : (
              <button
                className="btn btn-sm"
                disabled={busy}
                onClick={() => patch({ is_active: true }, "Account reactivated.")}
              >
                Reactivate
              </button>
            )}
          </div>
        </div>

        <div className="detail-grid mt">
          <Detail label="Cash balance" value={`$${Number(user.cash_balance).toLocaleString()}`} />
          <Detail label="Transactions" value={user.transaction_count} />
          <Detail label="Positions" value={user.positions.length} />
          <Detail label="Joined" value={new Date(user.date_joined).toLocaleDateString()} />
          <Detail label="Last login" value={user.last_login ? new Date(user.last_login).toLocaleString() : "Never"} />
        </div>
      </div>

      <div className="card mt">
        <div className="card-pad" style={{ paddingBottom: 0 }}>
          <h2 className="section-title">Positions</h2>
        </div>
        {user.positions.length === 0 ? (
          <div className="state">No open positions.</div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th className="num">Quantity</th>
                  <th className="num">Avg price</th>
                  <th className="num">Market value</th>
                </tr>
              </thead>
              <tbody>
                {user.positions.map((p) => (
                  <tr key={p.symbol}>
                    <td>{p.symbol}</td>
                    <td>{p.name}</td>
                    <td className="num">{p.quantity}</td>
                    <td className="num">${p.avg_price}</td>
                    <td className="num">${Number(p.market_value).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card mt">
        <div className="card-pad" style={{ paddingBottom: 0 }}>
          <h2 className="section-title">Recent transactions</h2>
        </div>
        {user.recent_transactions.length === 0 ? (
          <div className="state">No transactions.</div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th className="num">Qty</th>
                  <th className="num">Price</th>
                  <th className="num">Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {user.recent_transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{new Date(tx.created_at).toLocaleString()}</td>
                    <td>{tx.symbol}</td>
                    <td>
                      <StatusBadge value={tx.side} />
                    </td>
                    <td className="num">{tx.quantity}</td>
                    <td className="num">${tx.execution_price}</td>
                    <td className="num">${Number(tx.amount).toLocaleString()}</td>
                    <td>
                      <StatusBadge value={tx.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt" style={{ color: "var(--text-muted)", fontSize: 13 }}>
        Need to inspect this client's conversations?{" "}
        <Link to="/support">Open the support inbox</Link>.
      </div>
    </>
  );
}
