import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { apiErrorDetail } from "../api";
import StatusBadge from "../components/StatusBadge";
import { Banner, Empty, ErrorState, Loading } from "../components/States";

function Stat({ label, value, sub }) {
  return (
    <div className="card card-pad">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [statsRes, txRes, convRes] = await Promise.all([
          api.get("/api/admin/stats/"),
          api.get("/api/admin/transactions/", { params: { page_size: 8 } }),
          api.get("/api/conversations/"),
        ]);
        if (cancelled) return;
        setStats(statsRes.data);
        setRecentTx(txRes.data.results || []);
        setConversations((convRes.data || []).filter((c) => c.is_active).slice(0, 6));
      } catch (err) {
        if (!cancelled) setError(apiErrorDetail(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  if (!stats) return <Empty />;

  return (
    <>
      <Banner kind="success">
        All balances and trades shown here are demo/simulation data.
      </Banner>
      <div className="stats-grid">
        <Stat label="Total users" value={stats.users.total} sub={`${stats.users.new_last_7_days} new this week`} />
        <Stat label="Active users" value={stats.users.active} sub={`${stats.users.verified} verified`} />
        <Stat label="Admins" value={stats.users.admins} />
        <Stat label="Transactions" value={stats.transactions.total} sub={`${stats.transactions.last_7_days} this week`} />
        <Stat label="Trade volume" value={`$${Number(stats.transactions.total_volume).toLocaleString()}`} />
        <Stat label="Demo cash" value={`$${Number(stats.accounts.total_cash_balance).toLocaleString()}`} />
        <Stat
          label="Open conversations"
          value={stats.support.open_conversations}
          sub={`${stats.support.closed_conversations} closed`}
        />
        <Stat label="Open tickets" value={stats.support.open_tickets} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <div className="card">
          <div className="card-pad" style={{ paddingBottom: 0 }}>
            <h2 className="section-title">Recent transactions</h2>
          </div>
          {recentTx.length === 0 ? (
            <Empty message="No transactions yet." />
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTx.map((tx) => (
                    <tr key={tx.id}>
                      <td>{tx.user_email}</td>
                      <td>{tx.symbol}</td>
                      <td>
                        <StatusBadge value={tx.side} />
                      </td>
                      <td className="num">${Number(tx.amount).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-pad" style={{ paddingBottom: 0 }}>
            <h2 className="section-title">Open conversations</h2>
          </div>
          {conversations.length === 0 ? (
            <Empty message="No open conversations." />
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Subject</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {conversations.map((conv) => (
                    <tr key={conv.id}>
                      <td>{conv.user?.email || "—"}</td>
                      <td>
                        <Link to={`/support/${conv.id}`}>{conv.subject}</Link>
                      </td>
                      <td>{new Date(conv.updated_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
