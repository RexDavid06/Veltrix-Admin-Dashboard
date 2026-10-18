import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { apiErrorDetail } from "../api";
import Pagination from "../components/Pagination";
import StatusBadge from "../components/StatusBadge";
import { Banner, Empty, ErrorState, Loading } from "../components/States";

const PAGE_SIZE = 20;

export default function Users() {
  const [data, setData] = useState({ results: [], count: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [verified, setVerified] = useState("");
  const [active, setActive] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (search.trim()) params.search = search.trim();
      if (role) params.role = role;
      if (verified) params.is_verified = verified;
      if (active) params.is_active = active;
      const response = await api.get("/api/admin/users/", { params });
      setData(response.data);
    } catch (err) {
      setError(apiErrorDetail(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, role, verified, active]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  function resetFilters() {
    setSearch("");
    setRole("");
    setVerified("");
    setActive("");
    setPage(1);
  }

  return (
    <>
      <div className="filters">
        <label className="grow">
          Search
          <input
            placeholder="Email or name…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          Role
          <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
            <option value="">All</option>
            <option value="client">Client</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label>
          Verified
          <select value={verified} onChange={(e) => { setVerified(e.target.value); setPage(1); }}>
            <option value="">All</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
        </label>
        <label>
          Status
          <select value={active} onChange={(e) => { setActive(e.target.value); setPage(1); }}>
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Deactivated</option>
          </select>
        </label>
        <button className="btn btn-secondary" onClick={resetFilters}>
          Reset
        </button>
      </div>

      <div className="card">
        <Banner kind="error">{error}</Banner>
        {loading ? (
          <Loading />
        ) : data.results.length === 0 ? (
          <Empty message="No users match these filters." />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Verified</th>
                    <th>Status</th>
                    <th className="num">Cash balance</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((user) => (
                    <tr key={user.id} className="clickable" onClick={() => navigate(`/users/${user.id}`)}>
                      <td>{user.email}</td>
                      <td>{user.first_name || user.last_name ? `${user.first_name} ${user.last_name}`.trim() : "—"}</td>
                      <td>
                        <StatusBadge value={user.role} />
                      </td>
                      <td>
                        <StatusBadge value={user.is_verified} />
                      </td>
                      <td>
                        <span className={`badge ${user.is_active ? "badge-green" : "badge-red"}`}>
                          {user.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="num">${Number(user.cash_balance).toLocaleString()}</td>
                      <td>{new Date(user.date_joined).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} count={data.count} onPage={setPage} />
          </>
        )}
      </div>
    </>
  );
}
