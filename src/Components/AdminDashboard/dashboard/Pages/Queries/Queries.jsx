import { useEffect, useState } from "react";
import { db } from "../../../../../Firebase";
import { collection, onSnapshot, orderBy, query, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./Queries.css";

const Queries = () => {
  const [queries, setQueries] = useState([]);
  const [replyMap, setReplyMap] = useState({});
  const [searchName, setSearchName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [editMode, setEditMode] = useState({});
  const [editDraft, setEditDraft] = useState({});

  useEffect(() => {
    const q = query(collection(db, "queries"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      setQueries(items);
    });
    return () => unsub();
  }, []);

  const handleSendResponse = async (id) => {
    const text = replyMap[id]?.trim();
    if (!text) return;
    try {
      await updateDoc(doc(db, "queries", id), {
        adminResponse: text,
        status: "answered",
        respondedAt: serverTimestamp(),
        notifyUser: true,
      });
      setReplyMap((m) => ({ ...m, [id]: "" }));
      alert("Response sent and user will be notified.");
    } catch (e) {
      alert("Failed to send response: " + e.message);
    }
  };

  const handleStartEdit = (q) => {
    setEditMode((m) => ({ ...m, [q.id]: true }));
    setEditDraft((m) => ({ ...m, [q.id]: q.adminResponse || "" }));
  };

  const handleCancelEdit = (id) => {
    setEditMode((m) => ({ ...m, [id]: false }));
    setEditDraft((m) => ({ ...m, [id]: "" }));
  };

  const handleSaveEdit = async (id) => {
    const text = (editDraft[id] || "").trim();
    if (!text) return;
    try {
      await updateDoc(doc(db, "queries", id), {
        adminResponse: text,
        respondedAt: serverTimestamp(),
        notifyUser: true,
      });
      setEditMode((m) => ({ ...m, [id]: false }));
      setEditDraft((m) => ({ ...m, [id]: "" }));
      alert("Response updated and user will be notified.");
    } catch (e) {
      alert("Failed to update response: " + e.message);
    }
  };

  const normalizeDate = (ts) => {
    if (!ts) return null;
    try {
      if (typeof ts === "string") return new Date(ts);
      if (ts.toDate) return ts.toDate();
      return new Date(ts);
    } catch {
      return null;
    }
  };

  const formatDateTime = (ts) => {
    const d = normalizeDate(ts);
    if (!d) return "";
    try {
      const date = d.toLocaleDateString();
      const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return `${date} ${time}`;
    } catch {
      return d.toString();
    }
  };

  const filterQueries = () => {
    return queries.filter((q) => {
      const matchesName = !searchName || (q.userEmail || q.userId || "").toLowerCase().includes(searchName.toLowerCase());
      const created = normalizeDate(q.createdAt);
      const startOk = !startDate || (created && created >= new Date(startDate));
      const endOk = !endDate || (created && created <= new Date(endDate));
      return matchesName && startOk && endOk;
    });
  };

  const generatePDF = () => {
    const filtered = filterQueries();
    if (filtered.length === 0) {
      alert("No queries found for the selected filters.");
      return;
    }
    const docx = new jsPDF();
    docx.text("User Queries Report", 14, 15);

    const tableColumn = ["Query ID", "User", "Message", "Status", "Created", "Responded"];
    const tableRows = [];

    filtered.forEach((q) => {
      const created = normalizeDate(q.createdAt);
      const responded = normalizeDate(q.respondedAt);
      tableRows.push([
        q.id,
        q.userEmail || q.userId || "",
        (q.message || "").slice(0, 60),
        q.status || "open",
        created ? created.toLocaleDateString() : "",
        responded ? responded.toLocaleDateString() : "",
      ]);
    });

    autoTable(docx, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { cellWidth: 'wrap' },
      bodyStyles: { valign: 'top' },
      columnStyles: { 2: { cellWidth: 80 } }
    });

    docx.save("queries_report.pdf");
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>User Queries</h2>
      <div className="filters">
        <label>
          Search Name: <input type="text" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
        </label>
        <label>
          Start Date: <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          End Date: <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <button onClick={generatePDF} className="download-btn">Download PDF</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filterQueries().map((q) => (
          <div key={q.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ color: "#000" }}>{q.userEmail || q.userId}</strong>
                <div style={{ color: "#646363ff", marginTop: 4 }}>{q.message}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                  <span><strong>Created:</strong> {formatDateTime(q.createdAt) || "-"}</span>
                  {" \u00A0 | \u00A0 "}
                  <span><strong>Responded:</strong> {formatDateTime(q.respondedAt) || "-"}</span>
                </div>
                {q.adminResponse && !editMode[q.id] && (
                  <div style={{ marginTop: 8 }} className="admin-response-box">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <div>
                        <em className="admin-response-label">Admin response:</em> {q.adminResponse}
                      </div>
                      <button onClick={() => handleStartEdit(q)}>Edit</button>
                    </div>
                  </div>
                )}
                {q.adminResponse && editMode[q.id] && (
                  <div style={{ marginTop: 8 }} className="admin-response-box">
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="text"
                        value={editDraft[q.id] || ""}
                        onChange={(e) => setEditDraft((m) => ({ ...m, [q.id]: e.target.value }))}
                        style={{ flex: 1, padding: 8 }}
                        className="AdminresponseInput"
                      />
                      <button onClick={() => handleSaveEdit(q.id)}>Save</button>
                      <button onClick={() => handleCancelEdit(q.id)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
              <span style={{ fontSize: 12, color: q.status === "answered" ? "green" : "#fffafaff" }}>{q.status || "open"}</span>
            </div>
            {!q.adminResponse && (
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="Type response"
                  value={replyMap[q.id] || ""}
                  onChange={(e) => setReplyMap((m) => ({ ...m, [q.id]: e.target.value }))}
                  style={{ flex: 1, padding: 8 }}
                  className="AdminresponseInput"
                />
                <button onClick={() => handleSendResponse(q.id)}>Send</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Queries;


