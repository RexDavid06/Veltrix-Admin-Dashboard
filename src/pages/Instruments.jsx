import { useCallback, useEffect, useState } from "react";
import api, { apiErrorDetail } from "../api";
import Pagination from "../components/Pagination";
import { Banner, Empty, Loading } from "../components/States";

const PAGE_SIZE = 25;

export default function Instruments() {
  const [data, setData] = useState({ results: [], count: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [assetClass, setAssetClass] = useState("");
  const [active, setActive] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (search.trim()) params.search = search.trim();
      if (assetClass) params.asset_class = assetClass;
      if (active) params.is_active = active;
      const response = await api.get("/api/admin/instruments/", { params });
      setData(response.data);
    } catch (err) {
      setError(apiErrorDetail(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, assetClass, active]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  async function toggleActive(instrument) {
    setBusyId(instrument.id);
    setNotice("");
    setError("");
    try {
      await api.patch(`/api/admin/instruments/${instrument.id}/`, { is_active: !instrument.is_active });
      setNotice(`${instrument.symbol} ${instrument.is_active ? "hidden from clients" : "made visible to clients"}.`);
      await load();
    } catch (err) {
      setError(apiErrorDetail(err));
    } finally {
      setBusyId(null);
    }
  }

  const classes = [...new Set(data.results.map((r) => r.asset_class))];

  return (
    <>
      <div className="filters">
        <label className="grow">
          Search
          <input
            placeholder="Symbol or name…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </label>
        <label>
          Asset class
          <select value={assetClass} onChange={(e) => { setAssetClass(e.target.value); setPage(1); }}>
            <option value="">All</option>
            {classes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Visibility
          <select value={active} onChange={(e) => { setActive(e.target.value); setPage(1); }}>
            <option value="">All</option>
            <option value="true">Visible</option>
            <option value="false">Hidden</option>
          </select>
        </label>
      </div>

      <div className="card">
        <Banner kind="error">{error}</Banner>
        <Banner kind="success">{notice}</Banner>
        {loading ? (
          <Loading />
        ) : data.results.length === 0 ? (
          <Empty message="No instruments match these filters." />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Name</th>
                    <th>Asset class</th>
                    <th className="num">Price</th>
                    <th className="num">Change</th>
                    <th>Visibility</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((instrument) => (
                    <tr key={instrument.id}>
                      <td>{instrument.symbol}</td>
                      <td>{instrument.name}</td>
                      <td>{instrument.asset_class}</td>
                      <td className="num">${instrument.price}</td>
                      <td className="num">{instrument.change_percent}%</td>
                      <td>
                        <span className={`badge ${instrument.is_active ? "badge-green" : "badge-red"}`}>
                          {instrument.is_active ? "Visible" : "Hidden"}
                        </span>
                      </td>
                      <td className="num">
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={busyId === instrument.id}
                          onClick={() => toggleActive(instrument)}
                        >
                          {instrument.is_active ? "Hide" : "Show"}
                        </button>
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
