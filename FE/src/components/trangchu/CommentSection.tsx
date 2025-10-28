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
              fontWeight: 500,
              fontSize: 15,
              color: "#555",
              cursor: "pointer",
            }}
            onClick={onShowModal}
          >
            <MessageCircle
              size={22}
              style={{ verticalAlign: "middle", marginRight: 4 }}
            />
            {getTotalComments(comments).toLocaleString("vi-VN")} bình luận
          </span>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
