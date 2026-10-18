import { useCallback, useEffect, useState } from "react";
import api, { apiErrorDetail } from "../api";
import Pagination from "../components/Pagination";
import StatusBadge from "../components/StatusBadge";
import { Banner, Empty, Loading } from "../components/States";

const PAGE_SIZE = 25;

export default function Transactions() {
  const [data, setData] = useState({ results: [], count: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [side, setSide] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (search.trim()) params.search = search.trim();
      if (side) params.side = side;
      if (status) params.status = status;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const response = await api.get("/api/admin/transactions/", { params });
      setData(response.data);
    } catch (err) {
      setError(apiErrorDetail(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, side, status, dateFrom, dateTo]);

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
            placeholder="Symbol or user email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </label>
        <label>
          Side
          <select value={side} onChange={(e) => { setSide(e.target.value); setPage(1); }}>
            <option value="">All</option>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
            <option value="topup">Top-up</option>
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All</option>
            <option value="simulated">Simulated</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        <label>
          From
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
        </label>
        <label>
          To
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
        </label>
      </div>

      <div className="card">
        <Banner kind="error">{error}</Banner>
        {loading ? (
          <Loading />
        ) : data.results.length === 0 ? (
          <Empty message="No transactions match these filters." />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>User</th>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th className="num">Qty</th>
                    <th className="num">Price</th>
                    <th className="num">Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((tx) => (
                    <tr key={tx.id}>
                      <td>{new Date(tx.created_at).toLocaleString()}</td>
                      <td title={tx.user_email}>
                        {tx.user_name || tx.user_email}
                      </td>
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
            <Pagination page={page} pageSize={PAGE_SIZE} count={data.count} onPage={setPage} />
          </>
        )}
      </div>
    </>
  );
}
