import React from "react";
import { MessageCircle } from "lucide-react";
import { getTotalComments } from "../../utils/commentUtils";

interface CommentSectionProps {
  comments: any[];
  onShowModal: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  onShowModal,
}) => {
  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        {comments && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,                 // khoảng cách icon và số đẹp hơn
              fontWeight: 500,
              fontSize: 15,
              color: "#555",
              cursor: "pointer",
            }}
            onClick={onShowModal}
          >
            {/* <MessageCircle size={18} strokeWidth={1.3} /> */}
            {getTotalComments(comments).toLocaleString("vi-VN")}
            <MessageCircle size={18} strokeWidth={1.3} />
          </span>

        )}
      </div>
    </div>
  );
};

export default CommentSection;
