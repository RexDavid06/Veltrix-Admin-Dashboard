export default function Pagination({ page, pageSize, count, onPage }) {
  const pageCount = Math.max(1, Math.ceil((count || 0) / (pageSize || 20)));
  const first = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, count || 0);

  return (
    <div className="pagination">
      <span className="info">
        {count === 0 ? "No records" : `Showing ${first}–${last} of ${count}`}
      </span>
      <span style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <span className="info" style={{ alignSelf: "center" }}>
          Page {page} of {pageCount}
        </span>
        <button className="btn btn-secondary btn-sm" disabled={page >= pageCount} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </span>
    </div>
  );
}
