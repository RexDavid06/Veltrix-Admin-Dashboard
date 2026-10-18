import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { apiErrorDetail } from "../api";
import { getSessionUser } from "../auth";
import { Banner, Empty, ErrorState, Loading } from "../components/States";

function formatTime(value) {
  const date = new Date(value);
  const today = new Date().toDateString() === date.toDateString();
  return today ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : date.toLocaleDateString();
}

export default function Support() {
  const { id } = useParams();
  const navigate = useNavigate();
  const me = getSessionUser();

  const [conversations, setConversations] = useState([]);
  const [filter, setFilter] = useState("open");
  const [thread, setThread] = useState(null);
  const [draft, setDraft] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    setError("");
    try {
      const response = await api.get("/api/conversations/");
      const all = response.data || [];
      setConversations(
        filter === "all" ? all : all.filter((c) => (filter === "open" ? c.is_active : !c.is_active))
      );
    } catch (err) {
      setError(apiErrorDetail(err));
    } finally {
      setLoadingList(false);
    }
  }, [filter]);

  const loadThread = useCallback(async () => {
    if (!id) {
      setThread(null);
      return;
    }
    setLoadingThread(true);
    setError("");
    try {
      const response = await api.get(`/api/conversations/${id}/`);
      setThread(response.data);
    } catch (err) {
      setError(apiErrorDetail(err));
    } finally {
      setLoadingThread(false);
    }
  }, [id]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages?.length]);

  async function run(action, okMessage) {
    setBusy(true);
    setNotice("");
    setError("");
    try {
      await action();
      setNotice(okMessage);
      await Promise.all([loadThread(), loadList()]);
    } catch (err) {
      setError(apiErrorDetail(err));
    } finally {
      setBusy(false);
    }
  }

  function sendReply(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    run(async () => {
      await api.post(`/api/conversations/${id}/messages/`, { content });
      await api.post(`/api/conversations/${id}/mark-read/`);
      setDraft("");
    }, "Reply sent.");
  }

  const selected = conversations.find((c) => String(c.id) === String(id)) || thread;

  return (
    <>
      <Banner kind="error">{error}</Banner>
      {notice && <Banner kind="success">{notice}</Banner>}

      <div className="support-split">
        <div className="card">
          <div className="card-pad" style={{ paddingBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["open", "closed", "all"].map((value) => (
              <button
                key={value}
                className={`btn btn-sm ${filter === value ? "" : "btn-secondary"}`}
                onClick={() => setFilter(value)}
              >
                {value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
          <div className="conv-list">
            {loadingList ? (
              <Loading />
            ) : conversations.length === 0 ? (
              <Empty message={`No ${filter} conversations.`} />
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  className={`conv-item${String(conv.id) === String(id) ? " active" : ""}`}
                  onClick={() => navigate(`/support/${conv.id}`)}
                >
                  <div className="subject">{conv.subject || "General Support"}</div>
                  <div className="meta">
                    <span>{conv.user?.email || "Unknown user"}</span>
                    {conv.unread_count > 0 && <span className="badge badge-blue">{conv.unread_count} new</span>}
                  </div>
                  <div className="meta">
                    <span className={`badge ${conv.is_active ? "badge-green" : "badge-gray"}`}>
                      {conv.is_active ? "Open" : "Closed"}
                    </span>
                    <span>{formatTime(conv.updated_at)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="card thread">
          {!id ? (
            <Empty message="Select a conversation to view the thread." />
          ) : loadingThread ? (
            <Loading />
          ) : !thread ? (
            <ErrorState message="Conversation not found." />
          ) : (
            <>
              <div className="thread-header">
                <div>
                  <div style={{ fontWeight: 700 }}>{thread.subject || "General Support"}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    {thread.user?.email || "Unknown user"} · opened {new Date(thread.created_at).toLocaleString()}
                  </div>
                  <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span className={`badge ${thread.is_active ? "badge-green" : "badge-gray"}`}>
                      {thread.is_active ? "Open" : "Closed"}
                    </span>
                    {thread.assigned_to && (
                      <span className="badge badge-blue">Assigned to {thread.assigned_to.email}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {me && (!thread.assigned_to || thread.assigned_to.id !== me.id) && (
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={busy}
                      onClick={() =>
                        run(() => api.post(`/api/conversations/${thread.id}/assign/`, { assigned_to: me.id }), "Assigned to you.")
                      }
                    >
                      Assign to me
                    </button>
                  )}
                  {thread.is_active ? (
                    <button
                      className="btn btn-sm"
                      disabled={busy}
                      onClick={() => run(() => api.post(`/api/conversations/${thread.id}/resolve/`), "Conversation resolved.")}
                    >
                      Resolve
                    </button>
                  ) : (
                    <button
                      className="btn btn-sm"
                      disabled={busy}
                      onClick={() => run(() => api.post(`/api/conversations/${thread.id}/reopen/`), "Conversation reopened.")}
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>

              <div className="thread-messages">
                {(thread.messages || []).map((message) => {
                  const mine = Boolean(message.sender?.is_staff || message.sender?.role === "admin");
                  return (
                    <div key={message.id} className={`bubble${mine ? " mine" : ""}`}>
                      <div className="who">
                        {message.sender
                          ? `${message.sender.first_name || message.sender.username} · ${mine ? "support" : "client"}`
                          : "Unknown"}
                      </div>
                      <div style={{ whiteSpace: "pre-wrap" }}>{message.content}</div>
                      <div className="when">{new Date(message.created_at).toLocaleString()}</div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {thread.is_active ? (
                <form className="thread-compose" onSubmit={sendReply}>
                  <input
                    placeholder="Type a reply…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    disabled={busy}
                  />
                  <button className="btn" disabled={busy || !draft.trim()}>
                    Send
                  </button>
                </form>
              ) : (
                <div className="state">This conversation is closed. Reopen it to reply.</div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
