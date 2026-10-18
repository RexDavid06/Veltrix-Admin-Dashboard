const COLORS = {
  true: "badge-green",
  false: "badge-gray",
  completed: "badge-green",
  simulated: "badge-blue",
  pending: "badge-amber",
  open: "badge-blue",
  in_progress: "badge-amber",
  resolved: "badge-green",
  buy: "badge-green",
  sell: "badge-red",
  topup: "badge-blue",
  admin: "badge-blue",
  client: "badge-gray",
};

export default function StatusBadge({ value }) {
  if (value === null || value === undefined || value === "") return <span className="badge badge-gray">—</span>;
  const key = String(value);
  return <span className={`badge ${COLORS[key] || "badge-gray"}`}>{key}</span>;
}
