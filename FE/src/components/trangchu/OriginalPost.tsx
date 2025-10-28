import React from "react";

interface OriginalPostProps {
  avatar: string;
  name: string;
  date: string;
  content: string;
}

const OriginalPost: React.FC<OriginalPostProps> = ({ avatar, name, date, content }) => (
  <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fafbfc", padding: 16, marginTop: 4 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
      <img src={avatar} alt={name} style={{ width: 32, height: 32, borderRadius: "50%" }} />
      <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
      <div style={{ fontSize: 12, color: "#65676b" }}>{date}</div>
    </div>
    <div style={{ fontSize: 15, color: "#222", marginBottom: 4 }}>{content}</div>
  </div>
);

export default OriginalPost;
