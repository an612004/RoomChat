/**
 * Utility functions để xử lý sticker trong comments
 */

// Danh sách các sticker hợp lệ (giống với StickerPicker)
const VALID_STICKERS = [
  // Emotions
  "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
  "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩",
  "😘", "😗", "☺️", "😚", "😙", "🥲", "😋", "😛",
  "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔",
  // Reactions
  "😐", "😑", "😶", "🙄", "😏", "😣", "😥", "😮",
  "🤐", "😯", "😪", "😫", "🥱", "😴", "😌", "😛",
  "😜", "😝", "🤤", "😒", "😓", "😔", "😕", "🙃",
  "🫠", "😵", "😵‍💫", "🤯", "🤠", "🥳", "🥸", "😎",
  // Love
  "😍", "🥰", "😘", "😗", "😙", "😚", "💋", "💘",
  "💝", "💖", "💗", "💓", "💞", "💕", "💟", "❣️",
  "💔", "❤️‍🔥", "❤️‍🩹", "❤️", "🧡", "💛", "💚", "💙",
  "💜", "🤎", "🖤", "🤍", "💯", "💢", "💥", "💫",
  // Animals
  "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼",
  "🐻‍❄️", "🐨", "🐯", "🦁", "🐮", "🐷", "🐽", "🐸",
  "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦",
  "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "🐺",
  // Gestures
  "👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🤟",
  "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️",
  "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "🤝",
  "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵"
];

/**
 * Phân tích nội dung comment để tách sticker và text
 */
export function parseCommentContent(content: string) {
  const stickers: string[] = [];
  let cleanContent = content;

  // Tìm và tách các sticker
  for (const sticker of VALID_STICKERS) {
    if (content.includes(sticker)) {
      const regex = new RegExp(sticker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = content.match(regex);
      if (matches) {
        stickers.push(...matches);
        cleanContent = cleanContent.replace(regex, '').trim();
      }
    }
  }

  return {
    content: cleanContent,
    stickers: [...new Set(stickers)] // Remove duplicates
  };
}

/**
 * Kết hợp content và stickers để hiển thị
 */
export function renderCommentContent(content: string, stickers: string[] = []) {
  if (!stickers.length) return content;
  
  const stickerString = stickers.join(' ');
  return content ? `${content} ${stickerString}` : stickerString;
}

/**
 * Validate sticker
 */
export function isValidSticker(sticker: string): boolean {
  return VALID_STICKERS.includes(sticker);
}