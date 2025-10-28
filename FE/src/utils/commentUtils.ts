// Đếm tổng số bình luận (bao gồm replies)
export function getTotalComments(comments: any[]): number {
  let total = 0;
  for (const c of comments) {
    total++;
    if (c.replies && Array.isArray(c.replies)) {
      total += c.replies.length;
    }
  }
  return total;
}
