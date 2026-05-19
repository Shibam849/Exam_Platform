import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/student/results").then(r => setResults(r.data)).finally(() => setLoading(false));
  }, []);

  const pct = (s) => {
    const total = s.exam?.totalMarks;
    if (!total) return null;
    return Math.round((s.totalMarks / total) * 100);
  };

  const gradeBadge = (p) => {
    if (p === null) return null;
    if (p >= 80) return <span className="badge badge-green">A</span>;
    if (p >= 60) return <span className="badge badge-blue">B</span>;
    if (p >= 40) return <span className="badge badge-yellow">C</span>;
    return <span className="badge badge-red">F</span>;
  };

  return (
    <>
      <div className="page-header"><h1>My Results</h1><p>Your exam history and performance</p></div>

      {loading ? <div className="loading-box"><div className="spinner" /></div> :
       results.length === 0 ? (
         <div className="empty-state">
           <h3>No Results Yet</h3>
           <p>Take an exam to see your results here.</p>
         </div>
       ) : (
         <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
           {results.map(r => {
             const p = pct(r);
             return (
               <div key={r._id} className="card" style={{ display: "flex", alignItems: "center", gap: 20 }}>
                 <div style={{ flex: 1 }}>
                   <div style={{ fontWeight: 700, fontSize: 15 }}>{r.exam?.title || "Exam"}</div>
                   <div style={{ color: "var(--text2)", fontSize: 13 }}>{r.exam?.subject}</div>
                   <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 4 }}>
                     Submitted: {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "—"}
                   </div>
                 </div>

                 {r.published ? (
                   <>
                     <div style={{ textAlign: "center" }}>
                       <div style={{ fontSize: 26, fontWeight: 800, color: "var(--primary)" }}>{r.totalMarks}</div>
                       {r.exam?.totalMarks && <div style={{ fontSize: 12, color: "var(--text3)" }}>/ {r.exam.totalMarks}</div>}
                     </div>
                     {p !== null && (
                       <div style={{ textAlign: "center" }}>
                         <div style={{ fontSize: 20, fontWeight: 700 }}>{p}%</div>
                         <div style={{ marginTop: 4 }}>{gradeBadge(p)}</div>
                       </div>
                     )}
                     <Link to={`/student/results/${r._id}`} className="btn btn-primary btn-sm">
                       View Details & AI Feedback
                     </Link>
                   </>
                 ) : (
                   <span className="badge badge-yellow">⏳ Awaiting Results</span>
                 )}
               </div>
             );
           })}
         </div>
       )
      }
    </>
  );
}
