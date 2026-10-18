export function Loading() {
  return (
    <div className="state">
      <span className="spinner" />
      <div style={{ marginTop: 8 }}>Loading…</div>
    </div>
  );
}

export function Empty({ message = "Nothing to show yet." }) {
  return <div className="state">{message}</div>;
}

export function ErrorState({ message }) {
  return <div className="state error">{message || "Something went wrong."}</div>;
}

export function Banner({ kind = "error", children }) {
  if (!children) return null;
  return <div className={`banner banner-${kind}`}>{children}</div>;
}
