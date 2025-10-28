import React from "react";
import EmojiPickerReact, { EmojiClickData, Theme } from "emoji-picker-react";

const EmojiPicker: React.FC<{
  onEmojiClick: (e: EmojiClickData, emojiObj: any) => void;
}> = ({ onEmojiClick }) => {
  return (
    <EmojiPickerReact
      onEmojiClick={onEmojiClick}
      width={320}
      height={400}
      theme={Theme.LIGHT}
      previewConfig={{ showPreview: false }}
    />
  );
};

export default EmojiPicker;
