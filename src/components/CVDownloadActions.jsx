import React from "react";

export const CVDocument = ({ finalCV }) => {
  if (!finalCV) return null;

  return (
    <>
      <div
        className="header-name"
        style={{
          fontSize: "36px",
          fontWeight: 900,
          textAlign: "center",
        }}
      >
        {finalCV.name}
      </div>

      <div
        className="contact-info"
        style={{
          marginTop: "10px",
          textAlign: "center",
          background: "#e2e8f0",
          padding: "8px 12px",
          borderRadius: "10px",
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        {finalCV.contact}
      </div>

      {/* SUMMARY */}
      {finalCV.summary && (
        <div style={{ marginTop: "18px" }}>
          <div
            className="section-title"
            style={{
              fontWeight: 900,
              letterSpacing: "1px",
              textTransform: "uppercase",
              borderBottom: "2px solid #cbd5e1",
              padding: "10px 0 8px",
              marginBottom: "10px",
              fontSize: "14px",
            }}
          >
            Professional Summary
          </div>
          <p
            style={{
              fontSize: "14px",
              lineHeight: 1.45,
              textAlign: "justify",
            }}
          >
            {finalCV.summary}
          </p>
        </div>
      )}

      {/* EDUCATION */}
      {finalCV.education && finalCV.education.length > 0 && (
        <div style={{ marginTop: "18px" }}>
          <div
            className="section-title"
            style={{
              fontWeight: 900,
              letterSpacing: "1px",
              textTransform: "uppercase",
              borderBottom: "2px solid #cbd5e1",
              padding: "10px 0 8px",
              marginBottom: "10px",
              fontSize: "14px",
            }}
          >
            Education
          </div>
          {finalCV.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: "10px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 800,
                  fontSize: "14px",
                }}
              >
                <span>
                  {edu.school}
                  {edu.location ? `, ${edu.location}` : ""}
                </span>
                <span>{edu.date}</span>
              </div>
              <div style={{ fontSize: "14px" }}>{edu.degree}</div>
            </div>
          ))}
        </div>
      )}

      {/* COURSES */}
      {finalCV.courses && finalCV.courses.length > 0 && (
        <div style={{ marginTop: "18px" }}>
          <div
            className="section-title"
            style={{
              fontWeight: 900,
              letterSpacing: "1px",
              textTransform: "uppercase",
              borderBottom: "2px solid #cbd5e1",
              padding: "10px 0 8px",
              marginBottom: "10px",
              fontSize: "14px",
            }}
          >
            Relevant Courses
          </div>

          {finalCV.courses.map((course, i) => (
            <div
              key={i}
              style={{
                marginBottom: "6px",
                display: "flex",
                justifyContent: "space-between",
                fontSize: "14px",
              }}
            >
              <span>
                <strong>{course.name}</strong>
                {course.provider ? ` – ${course.provider}` : ""}
              </span>
              <span>{course.date}</span>
            </div>
          ))}
        </div>
      )}

      {/* EXPERIENCE */}
      {finalCV.experience && finalCV.experience.length > 0 && (
        <div style={{ marginTop: "18px" }}>
          <div
            className="section-title"
            style={{
              fontWeight: 900,
              letterSpacing: "1px",
              textTransform: "uppercase",
              borderBottom: "2px solid #cbd5e1",
              padding: "10px 0 8px",
              marginBottom: "10px",
              fontSize: "14px",
            }}
          >
            Work Experience
          </div>

          {finalCV.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: "14pt" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 800,
                  fontSize: "14px",
                }}
              >
                <span>
                  {exp.company}
                  {exp.location ? `, ${exp.location}` : ""}
                </span>
                <span>{exp.dates}</span>
              </div>

              <div
                style={{
                  fontStyle: "italic",
                  marginTop: "4px",
                  fontSize: "14px",
                }}
              >
                {exp.title}
              </div>

              <ul
                style={{
                  marginTop: "6px",
                  paddingLeft: "18px",
                  fontSize: "14px",
                  lineHeight: 1.45,
                }}
              >
                {(exp.bullets || []).map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* SKILLS */}
      {(finalCV.skills || finalCV.languages) && (
        <div style={{ marginTop: "18px" }}>
          <div
            className="section-title"
            style={{
              fontWeight: 900,
              letterSpacing: "1px",
              textTransform: "uppercase",
              borderBottom: "2px solid #cbd5e1",
              padding: "10px 0 8px",
              marginBottom: "10px",
              fontSize: "14px",
            }}
          >
            Skills
          </div>

          {finalCV.languages && (
            <p style={{ marginBottom: "8px", fontSize: "14px" }}>
              <strong>Languages:</strong> {finalCV.languages}
            </p>
          )}

          {finalCV.skills && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "6px",
                fontSize: "14px",
              }}
            >
              {finalCV.skills.map((skill, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#0f172a",
                      marginTop: "6px",
                      flexShrink: 0,
                    }}
                  />
                  {skill}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};
