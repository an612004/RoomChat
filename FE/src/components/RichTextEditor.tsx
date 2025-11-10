import React, { useState } from 'react';
import './RichTextEditor.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = "Nhập nội dung..." 
}) => {
  const [selectedFontFamily, setSelectedFontFamily] = useState('Arial');
  const [selectedHeading, setSelectedHeading] = useState('p');

  // Format text function
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  // Handle content change
  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML;
    onChange(content);
  };

  // Apply font family
  const applyFontFamily = (fontFamily: string) => {
    setSelectedFontFamily(fontFamily);
    formatText('fontName', fontFamily);
  };

  // Apply heading
  const applyHeading = (heading: string) => {
    setSelectedHeading(heading);
    formatText('formatBlock', heading);
  };

  return (
    <div className="rich-text-editor">
      {/* Toolbar */}
      <div className="editor-toolbar">
        {/* Font Family */}
        <div className="toolbar-group">
          <select 
            value={selectedFontFamily} 
            onChange={(e) => applyFontFamily(e.target.value)}
            className="font-family-select"
          >
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Times New Roman">Times</option>
            <option value="Courier New">Courier</option>
            <option value="Verdana">Verdana</option>
            <option value="Comic Sans MS">Comic Sans</option>
          </select>
        </div>

        {/* Heading */}
        <div className="toolbar-group">
          <select 
            value={selectedHeading} 
            onChange={(e) => applyHeading(e.target.value)}
            className="heading-select"
          >
            <option value="p">Đoạn văn</option>
            <option value="h1">Tiêu đề 1</option>
            <option value="h2">Tiêu đề 2</option>
            <option value="h3">Tiêu đề 3</option>
            <option value="h4">Tiêu đề 4</option>
            <option value="h5">Tiêu đề 5</option>
            <option value="h6">Tiêu đề 6</option>
          </select>
        </div>

        {/* Text Formatting */}
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => formatText('bold')}
            className="format-btn"
            title="Đậm"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => formatText('italic')}
            className="format-btn"
            title="Nghiêng"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => formatText('underline')}
            className="format-btn"
            title="Gạch chân"
          >
            <u>U</u>
          </button>
          <button
            type="button"
            onClick={() => formatText('strikeThrough')}
            className="format-btn"
            title="Gạch ngang"
          >
            <s>S</s>
          </button>
        </div>

        {/* Colors */}
        <div className="toolbar-group">
          <input
            type="color"
            onChange={(e) => formatText('foreColor', e.target.value)}
            className="color-picker"
            title="Màu chữ"
            defaultValue="#000000"
          />
          <input
            type="color"
            onChange={(e) => formatText('backColor', e.target.value)}
            className="color-picker"
            title="Màu nền"
            defaultValue="#ffffff"
          />
        </div>

        {/* Alignment */}
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => formatText('justifyLeft')}
            className="format-btn"
            title="Canh trái"
          >
            ⬅
          </button>
          <button
            type="button"
            onClick={() => formatText('justifyCenter')}
            className="format-btn"
            title="Canh giữa"
          >
            ⬌
          </button>
          <button
            type="button"
            onClick={() => formatText('justifyRight')}
            className="format-btn"
            title="Canh phải"
          >
            ➡
          </button>
        </div>

        {/* Lists */}
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => formatText('insertUnorderedList')}
            className="format-btn"
            title="Danh sách không đánh số"
          >
            • List
          </button>
          <button
            type="button"
            onClick={() => formatText('insertOrderedList')}
            className="format-btn"
            title="Danh sách đánh số"
          >
            1. List
          </button>
        </div>

        {/* Link */}
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => {
              const url = prompt('Nhập URL:');
              if (url) formatText('createLink', url);
            }}
            className="format-btn"
            title="Chèn liên kết"
          >
            🔗
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div
        className="editor-content"
        contentEditable
        onInput={handleContentChange}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
    </div>
  );
};

export default RichTextEditor;