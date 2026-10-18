import { useCallback, useEffect, useState } from "react";
import api, { apiErrorDetail } from "../api";
import Pagination from "../components/Pagination";
import { Banner, Empty, Loading } from "../components/States";

const PAGE_SIZE = 25;

export default function Audit() {
  const [data, setData] = useState({ results: [], count: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [includeRequests, setIncludeRequests] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (search.trim()) params.search = search.trim();
      if (includeRequests) params.include_requests = "1";
      const response = await api.get("/api/admin/audit/", { params });
      setData(response.data);
    } catch (err) {
      setError(apiErrorDetail(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, includeRequests]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  return (
    <>
      <div className="filters">
        <label className="grow">
          Search
          <input
            placeholder="Action or details…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </label>
        <label style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 8 }}>
          <input
            type="checkbox"
            style={{ width: "auto" }}
            checked={includeRequests}
            onChange={(e) => { setIncludeRequests(e.target.checked); setPage(1); }}
          />
          Include routine request logs
        </label>
      </div>

      <div className="card">
        <Banner kind="error">{error}</Banner>
        {loading ? (
          <Loading />
        ) : data.results.length === 0 ? (
          <Empty message="No audit entries match." />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Target</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((entry) => (
                    <tr key={entry.id}>
                      <td style={{ whiteSpace: "nowrap" }}>{new Date(entry.created_at).toLocaleString()}</td>
                      <td>{entry.actor_email || "—"}</td>
                      <td>
                        <code>{entry.action}</code>
                      </td>
                      <td>{entry.target_email || "—"}</td>
                      <td style={{ maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={entry.details}>
                        {entry.details || "—"}
                      </td>
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
