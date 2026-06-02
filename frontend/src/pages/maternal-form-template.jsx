/**
 * MaternalHealthRecord.jsx
 *
 * Changes:
 * 1. Removed bottom ActionBar (Print + Cancel buttons)
 * 2. Added floating circular print button (bottom-right)
 * 3. Auto-prints on mount (window.print() via useEffect)
 * 4. Full A4 page, blank space below fixed with all:unset on print
 */

import { useEffect, useState } from "react";

const printStyle = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  p { margin: 0; }
  body { background: #f0ede8; }

  @media print {
    @page { size: A4 portrait; margin: 5mm; }

    html, body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      background: white !important;
      width: 100% !important;
      height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
    }

    .no-print { display: none !important; }

    .outer-wrapper {
      all: unset !important;
      display: block !important;
      width: 100% !important;
    }

    .page {
      all: unset !important;
      display: block !important;
      width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
      background: white !important;
    }
  }
`;

/* helpers */
function toTitleCase(str) {
  if (!str) return str;
  return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}
function buildFullName(resident) {
  if (!resident) return "";
  if (resident.full_name) return resident.full_name;
  const { f_name, m_name, l_name, s_name } = resident;
  return [l_name, f_name, m_name, s_name].filter(Boolean).join(" ");
}
function fmtDate(str) {
  if (!str) return "";
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

const F = ({ value, flex = 1, minW = 30 }) => (
  <span style={{ display: "inline-block", flex, minWidth: minW, borderBottom: value ? "none" : "1px solid #000", height: "0.85em", verticalAlign: "bottom", fontSize: "6.5pt", paddingLeft: value ? 2 : 0, lineHeight: 1 }}>
    {value ?? ""}
  </span>
);

const CB = ({ label, checked }) => (
  <label style={{ fontSize: "6.5pt", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 2 }}>
    <input type="checkbox" readOnly checked={!!checked} style={{ width: 8, height: 8, flexShrink: 0 }} />
    <span style={{ fontWeight: 700 }}>{label}</span>
  </label>
);

const Sec = ({ text }) => (
  <div style={{ background: "#000", color: "#fff", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "6pt", padding: "1px 4px" }}>
    {text}
  </div>
);

const B = ({ children, style: s }) => (
  <span style={{ fontWeight: 700, fontSize: "6.5pt", ...s }}>{children}</span>
);

const cell = (extra = {}) => ({ border: "1px solid #000", borderTop: "none", padding: "1px 3px", fontSize: "6.5pt", verticalAlign: "middle", ...extra });
const thStyle = (extra = {}) => ({ border: "1px solid #000", borderTop: "none", background: "#d8d8d8", fontSize: "5.5pt", fontWeight: 700, textTransform: "uppercase", textAlign: "center", padding: "1px 2px", lineHeight: 1.15, verticalAlign: "middle", ...extra });

const LF = ({ label, value }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
    <B>{label}</B>
    {value ? <span style={{ fontSize: "6.5pt" }}>{value}</span> : <F value={undefined} />}
  </div>
);

const YesNo = ({ value }) => {
  const isYes = value === "YES" || value === true || value === "yes";
  const isNo = value === "NO" || value === false || value === "no";
  return (<><CB label="YES" checked={isYes} /><CB label="NO" checked={isNo} /></>);
};

const CHECKLIST_KEYS = [
  ["nausea","Nausea"],["dizziness","Dizziness"],["constipation","Constipation"],["cramps","Cramps"],
  ["pruritus","Pruritus"],["leukorrhea","Leukorrhea"],["headache","Headache"],["bleeding","Bleeding"],
  ["edema","Edema"],["vomiting","Vomiting"],["blurring","Blurring of Vision"],
];

const TRIM_GROUPS = [
  { key: "1st", label: "1ST", rows: 4 },
  { key: "2nd", label: "2ND", rows: 4 },
  { key: "3rd", label: "3RD", rows: 4 },
];

const FloatingPrintButton = () => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      className="no-print"
      onClick={() => window.print()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Print / Save as PDF"
      style={{
        position: "fixed", bottom: 32, right: 32, zIndex: 200,
        display: "inline-flex", alignItems: "center", gap: hovered ? 10 : 0,
        overflow: "hidden", padding: hovered ? "13px 22px 13px 18px" : "13px",
        width: hovered ? "auto" : 50, height: 50, borderRadius: 999, border: "none",
        background: "#1a1815", color: "#f5f2ee", fontFamily: "'DM Sans', sans-serif",
        fontWeight: 600, fontSize: "13px", letterSpacing: "0.05em", cursor: "pointer",
        boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.32)" : "0 4px 18px rgba(0,0,0,0.22)",
        transition: "all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)", whiteSpace: "nowrap",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
        <rect x="3" y="7" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M6 7V3.5C6 3.22 6.22 3 6.5 3h7c.28 0 .5.22.5.5V7" stroke="currentColor" strokeWidth="1.6"/>
        <rect x="6" y="11.5" width="8" height="3.5" rx="0.5" fill="currentColor"/>
        <circle cx="14.5" cy="9" r="1" fill="currentColor"/>
      </svg>
      <span style={{ maxWidth: hovered ? 120 : 0, opacity: hovered ? 1 : 0, overflow: "hidden", transition: "max-width 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.15s ease", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "12px" }}>
        Print / PDF
      </span>
    </button>
  );
};

export default function MaternalHealthRecord({ record }) {
  useEffect(() => {
    const timer = setTimeout(() => { window.print(); }, 600);
    return () => clearTimeout(timer);
  }, []);

  const raw = record ?? {};
  const details = typeof raw.details === "string" ? (() => { try { return JSON.parse(raw.details); } catch { return {}; } })() : raw.details ?? {};

  const pi = details.patientInfo ?? {};
  const ph = details.preNatalHistory ?? {};
  const co = ph.complications ?? {};
  const fp = details.familyPlanning ?? {};
  const pp = details.presentPregnancy ?? {};
  const chk = pp.checklist ?? {};
  const vis = details.visits ?? {};
  const ri = details.risk ?? {};
  const dl = details.delivery ?? {};
  const pt = details.postPartum ?? [];

  const hr = raw.health_record ?? {};
  const resident = raw.resident ?? hr.resident ?? {};
  const hrDet = hr.details ?? {};

  const fullName = toTitleCase(buildFullName(resident));
  const dob = resident.b_date ? fmtDate(resident.b_date) : "";
  const age = resident.age != null ? `${resident.age} yrs` : pi.age ? `${pi.age} yrs` : "";
  const familyNo = hrDet.familyNo ?? raw.family_no ?? (raw.health_record_id ? raw.health_record_id.slice(0, 8).toUpperCase() : "");

  const visitRows = [];
  TRIM_GROUPS.forEach(({ key, label, rows }) => {
    const bucket = Array.isArray(vis[key]) ? vis[key] : [];
    for (let r = 0; r < rows; r++) visitRows.push({ trimLabel: r === 0 ? label : "", v: bucket[r] ?? null });
  });

  const postRows = [...pt];
  while (postRows.length < 4) postRows.push(null);

  const ROW_H = 13;

  return (
    <>
      <style>{printStyle}</style>
      <div className="outer-wrapper" style={{ background: "#f0ede8", padding: "28px 8px", fontFamily: "Arial, sans-serif" }}>
        <div className="page" style={{ width: "210mm", maxWidth: "100%", background: "#fff", margin: "0 auto", padding: "5mm 6mm", boxShadow: "0 8px 48px rgba(0,0,0,0.14)", borderRadius: 2, boxSizing: "border-box" }}>

          {/* Title */}
          <div style={{ border: "1px solid #000", textAlign: "center", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.16em", fontSize: "10pt", padding: "2px 0" }}>
            Maternal Health Record
          </div>

          {/* Family No */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody><tr>
              <td style={cell({ width: "68%", borderLeft: "none" })} />
              <td style={cell({ borderLeft: "none" })}><LF label="Family No:" value={familyNo} /></td>
            </tr></tbody>
          </table>

          {/* Patient info */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={cell({ width: "44%" })}><LF label="Name:" value={fullName} /></td>
                <td style={cell({ width: "32%", borderLeft: "none" })}><LF label="Date of Birth:" value={dob} /></td>
                <td style={cell({ borderLeft: "none" })}><LF label="Age:" value={age} /></td>
              </tr>
              <tr>
                <td style={cell({ width: "44%" })}><LF label="Husband's Name:" value={toTitleCase(pi.husbandName)} /></td>
                <td style={cell({ borderLeft: "none" })} colSpan={2}><LF label="Husband Occupation:" value={toTitleCase(pi.husbandOccupation)} /></td>
              </tr>
              <tr>
                <td style={cell()} colSpan={3}><LF label="Address:" value={toTitleCase(pi.address)} /></td>
              </tr>
            </tbody>
          </table>

          {/* I. Pre-Natal History */}
          <Sec text="I. Pre-Natal History" />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody><tr>
              <td style={cell({ width: "50%", verticalAlign: "top" })}>
                <div style={{ fontSize: "5.5pt", fontWeight: 700, textTransform: "uppercase", marginBottom: 1 }}>Previous Pregnancies</div>
                {[["1. No. of children born alive", ph.childrenAlive],["2. No. of living children", ph.livingChildren],["3. No. of abortion", ph.abortions],["4. No. of still birth / Fetal deaths", ph.stillBirths]].map(([lbl, val]) => (
                  <div key={lbl} style={{ display: "flex", alignItems: "flex-end", gap: 3, marginBottom: 1.5 }}>
                    <span style={{ fontSize: "6.5pt", flex: 1 }}>{lbl}</span>
                    <F value={val != null ? String(val) : undefined} flex={0} minW={32} />
                  </div>
                ))}
              </td>
              <td style={cell({ verticalAlign: "top", borderLeft: "none" })}>
                <div style={{ fontSize: "5.5pt", fontWeight: 700, textTransform: "uppercase", marginBottom: 1 }}>Previous Pregnancies – Complication</div>
                {[["Hemorrhage", co.hemorrhage],["Toxemia", co.toxemia],["Placenta Previa", co.placentaPrevia],["Sepsis", co.sepsis]].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 1.5 }}>
                    <span style={{ fontSize: "6.5pt", flex: 1 }}>{label}</span>
                    <YesNo value={val} />
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3, marginTop: 1 }}>
                  <span style={{ fontSize: "6.5pt", fontWeight: 700, whiteSpace: "nowrap" }}>Other (Specify):</span>
                  <F value={co.other} />
                </div>
              </td>
            </tr></tbody>
          </table>

          {/* II. Family Planning */}
          <Sec text="II. Family Planning" />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody><tr>
              <td style={cell({ width: "50%", verticalAlign: "top" })}>
                <div style={{ fontSize: "5.5pt", fontWeight: 700, textTransform: "uppercase", marginBottom: 1 }}>Family Planning</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 1.5 }}>
                  <span style={{ fontSize: "6.5pt", flex: 1 }}>1. Has Family Planning been practiced?</span>
                  <YesNo value={fp.practiced} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 1.5 }}>
                  <span style={{ fontSize: "6.5pt", fontWeight: 700, whiteSpace: "nowrap" }}>2. What Method?</span>
                  {fp.method ? <span style={{ fontSize: "6.5pt" }}>{fp.method}</span> : <F value={undefined} />}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: "6.5pt", flex: 1 }}>3. Willing to practice?</span>
                  <YesNo value={fp.willingToPractice} />
                </div>
              </td>
              <td style={cell({ verticalAlign: "top", borderLeft: "none" })}>
                <div style={{ fontSize: "5.5pt", fontWeight: 700, textTransform: "uppercase", marginBottom: 1 }}>Family History</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
                  <span style={{ fontSize: "6.5pt", fontWeight: 700, whiteSpace: "nowrap" }}>Specify:</span>
                  <F value={[fp.familyHistoryYes, fp.familyHistorySpecify].filter(Boolean).join(" — ")} />
                </div>
              </td>
            </tr></tbody>
          </table>

          {/* Present Pregnancy */}
          <Sec text="Present Pregnancy" />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody><tr>
              <td style={cell({ width: "55%", verticalAlign: "top" })}>
                <div style={{ display: "flex", gap: 14, marginBottom: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <F value={pp.gravida && pp.gravida !== true && pp.gravida !== "true" ? String(pp.gravida) : pp.gravida ? "✓" : undefined} flex={0} minW={24} />
                    <B>GRAVIDA</B>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <F value={pp.para && pp.para !== true && pp.para !== "true" ? String(pp.para) : pp.para ? "✓" : undefined} flex={0} minW={24} />
                    <B>PARA</B>
                  </div>
                </div>
                <LF label="Last Menstruation (Date):" value={pp.lastMenstruation ? fmtDate(pp.lastMenstruation) : ""} />
                <div style={{ marginBottom: 2 }} />
                <LF label="Expected Date of Confinement:" value={pp.expectedConfinement ? fmtDate(pp.expectedConfinement) : ""} />
                <div style={{ marginBottom: 2 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <B>Special Cases:</B><YesNo value={pp.specialCases} />
                </div>
              </td>
              <td style={cell({ verticalAlign: "top", borderLeft: "none" })}>
                <div style={{ fontSize: "5.5pt", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Checklist</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 6px" }}>
                  {CHECKLIST_KEYS.map(([key, label]) => <CB key={key} label={label} checked={!!chk[key]} />)}
                </div>
              </td>
            </tr></tbody>
          </table>

          {/* Pre-Natal Visits */}
          <Sec text="Pre-Natal Visits" />
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "7%" }} /><col style={{ width: "10%" }} /><col style={{ width: "12%" }} />
              <col style={{ width: "10%" }} /><col style={{ width: "14%" }} /><col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} /><col style={{ width: "19%" }} />
            </colgroup>
            <thead>
              <tr>
                {["Trimester","Date","Weight / BP","Iron / VA (180)","AOG / Pres / FH / FHB","TT Status / TT Imm Given","Urinalysis & Dental Checkup","Remarks"].map((h, i) => (
                  <th key={i} style={thStyle(i > 0 ? { borderLeft: "none" } : {})}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visitRows.map(({ trimLabel, v }, idx) => (
                <tr key={idx} style={{ height: ROW_H }}>
                  <td style={{ border: "1px solid #000", borderTop: "none", textAlign: "center", fontWeight: 700, fontSize: "6.5pt", padding: "0 2px" }}>{trimLabel}</td>
                  {["date","weight","iron","aog","tt","urinalysis","remarks"].map((f, ci) => (
                    <td key={ci} style={{ border: "1px solid #000", borderTop: "none", borderLeft: "none", padding: "0 2px", fontSize: "6pt", verticalAlign: "middle" }}>
                      {f === "date" && v?.[f] ? fmtDate(v[f]) : v?.[f] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Risk Code row */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody><tr>
              <td style={cell({ width: "42%" })}><LF label="Risk Code:" value={ri.code} /></td>
              <td style={cell({ borderLeft: "none" })}><LF label="Date when risk detected:" value={ri.date ? fmtDate(ri.date) : ""} /></td>
            </tr></tbody>
          </table>

          {/* III. Delivery */}
          <Sec text="III. Delivery" />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={cell({ width: "33%" })}><LF label="Date:" value={dl.date ? fmtDate(dl.date) : ""} /></td>
                <td style={cell({ borderLeft: "none", width: "34%" })}><LF label="Name of Child:" value={toTitleCase(dl.childName)} /></td>
                <td style={cell({ borderLeft: "none" })}><LF label="Sex:" value={dl.sex} /></td>
              </tr>
              <tr>
                <td style={cell()}><LF label="Weight:" value={dl.weight} /></td>
                <td style={cell({ borderLeft: "none" })}><LF label="Place:" value={toTitleCase(dl.place)} /></td>
                <td style={cell({ borderLeft: "none" })}><LF label="Attended by:" value={toTitleCase(dl.attendedBy)} /></td>
              </tr>
              <tr>
                <td style={cell()} colSpan={3}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <B>Type of Delivery:</B>
                    <CB label="Normal" checked={dl.deliveryType === "Normal"} />
                    <CB label="Abnormal" checked={dl.deliveryType === "Abnormal"} />
                    <B style={{ marginLeft: 6 }}>Specify:</B>
                    <F value={dl.abnormalSpec} />
                  </div>
                </td>
              </tr>
              <tr><td style={cell()} colSpan={3}><LF label="Abnormality:" value={dl.abnormality} /></td></tr>
              <tr><td style={cell()} colSpan={3}><LF label="New Born Screening:" value={dl.newBornScreening} /></td></tr>
            </tbody>
          </table>

          {/* IV. Post Partum Follow-Up */}
          <Sec text="IV. Post Partum Follow-Up" />
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "10%" }} /><col style={{ width: "15%" }} /><col style={{ width: "6%" }} />
              <col style={{ width: "4%" }} /><col style={{ width: "4%" }} /><col style={{ width: "5%" }} />
              <col style={{ width: "12%" }} /><col style={{ width: "10%" }} /><col style={{ width: "14%" }} /><col style={{ width: "20%" }} />
            </colgroup>
            <thead>
              <tr>
                <th style={thStyle()} rowSpan={2}>Date</th>
                <th style={thStyle({ borderLeft: "none" })} rowSpan={2}>Vital Signs (BP / WT / Temp)</th>
                <th style={thStyle({ borderLeft: "none" })} rowSpan={2}>FH</th>
                <th style={thStyle({ borderLeft: "none" })} colSpan={3}>Feeding</th>
                <th style={thStyle({ borderLeft: "none" })} rowSpan={2}>Vaginal Discharge</th>
                <th style={thStyle({ borderLeft: "none" })} rowSpan={2}>Iron / VA</th>
                <th style={thStyle({ borderLeft: "none" })} rowSpan={2}>Observation &amp; Care</th>
                <th style={thStyle({ borderLeft: "none" })} rowSpan={2}>Remarks</th>
              </tr>
              <tr>
                {["B","BO","MIX"].map((h) => (
                  <th key={h} style={{ border: "1px solid #000", borderTop: "none", borderLeft: "none", background: "#d8d8d8", fontSize: "5.5pt", fontWeight: 700, textTransform: "uppercase", textAlign: "center", padding: "1px 2px", verticalAlign: "middle" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {postRows.map((row, i) => (
                <tr key={i} style={{ height: ROW_H }}>
                  <td style={{ border: "1px solid #000", borderTop: "none", padding: "0 2px", fontSize: "6pt", verticalAlign: "middle" }}>{row?.date ? fmtDate(row.date) : ""}</td>
                  <td style={{ border: "1px solid #000", borderTop: "none", borderLeft: "none", padding: "0 2px", fontSize: "6pt", verticalAlign: "middle" }}>{row?.bp ?? ""}</td>
                  <td style={{ border: "1px solid #000", borderTop: "none", borderLeft: "none", padding: "0 2px", fontSize: "6pt", verticalAlign: "middle" }}>{row?.fh ?? ""}</td>
                  {["b","bo","mix"].map((f) => (
                    <td key={f} style={{ border: "1px solid #000", borderTop: "none", borderLeft: "none", padding: "0 2px", fontSize: "6pt", textAlign: "center", verticalAlign: "middle" }}>{row?.[f] ? "✓" : ""}</td>
                  ))}
                  {["vaginal","iron","observation","remarks"].map((f) => (
                    <td key={f} style={{ border: "1px solid #000", borderTop: "none", borderLeft: "none", padding: "0 2px", fontSize: "6pt", verticalAlign: "middle" }}>{row?.[f] ?? ""}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Risk Code Legend */}
          <div style={{ border: "1px solid #000", borderTop: "none", padding: "2px 5px" }}>
            <div style={{ fontSize: "6pt", fontWeight: 700, textDecoration: "underline", marginBottom: 1 }}>* RISK CODE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px", fontSize: "5.5pt", lineHeight: 1.45 }}>
              <div>
                <p><strong>A</strong> – Age less than 18 or greater than 35</p>
                <p><strong>B</strong> – Being less than 145 cm (4'9") tall</p>
                <p><strong>C</strong> – Having a fourth (or more) baby (grand multi)</p>
                <p><strong>D</strong> – Having/had one or more of the ff.:</p>
                <p style={{ paddingLeft: 8 }}>(a) A previous caesarian section</p>
                <p style={{ paddingLeft: 8 }}>(b) 3 consecutive miscarriages or stillborn baby</p>
                <p style={{ paddingLeft: 8 }}>(c) Postpartum hemorrhage</p>
              </div>
              <div>
                <p><strong>E</strong> – Having one or more of the ff. medical conditions:</p>
                <p style={{ paddingLeft: 8 }}>(1) Tuberculosis</p>
                <p style={{ paddingLeft: 8 }}>(2) Heart Diseases</p>
                <p style={{ paddingLeft: 8 }}>(3) Diabetes</p>
                <p style={{ paddingLeft: 8 }}>(4) Bronchial Asthma</p>
                <p style={{ paddingLeft: 8 }}>(5) Goiter</p>
              </div>
            </div>
          </div>

        </div>{/* end .page */}

        <FloatingPrintButton />
      </div>
    </>
  );
}