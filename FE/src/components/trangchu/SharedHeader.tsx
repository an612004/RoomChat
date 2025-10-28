import React from "react";

interface SharedHeaderProps {
  avatar: string;
  name: string;
  date: string;
}

const SharedHeader: React.FC<SharedHeaderProps> = ({ avatar, name, date }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
    <img src={avatar} alt={name} style={{ width: 40, height: 40, borderRadius: "50%", boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }} />
    <div style={{ fontWeight: 700, fontSize: 15, color: "#1b1b1b" }}>{name}</div>
    <div style={{ fontSize: 12, color: "#65676b" }}>{date}</div>
  </div>
);

export default SharedHeader;
