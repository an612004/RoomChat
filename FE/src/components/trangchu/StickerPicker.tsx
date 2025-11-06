import React from "react";

interface StickerPickerProps {
    onStickerSelect: (sticker: { url: string; name: string }) => void;
    onClose: () => void;
}

// Danh sách sticker GIF theo danh mục
const STICKER_CATEGORIES = {
    happy: {
        name: "Vui vẻ",
        stickers: [
            { name: "happy1", url: "https://media.giphy.com/media/XR9Dp54ZC4dji/giphy.gif" },
            { name: "happy2", url: "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif" },
            { name: "happy3", url: "https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif" },
            { name: "happy4", url: "https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif" },
            { name: "happy5", url: "https://media.giphy.com/media/8Iv5lqKwKsZ2g/giphy.gif" },
            { name: "happy6", url: "https://media.giphy.com/media/3oz8xLlw6GHVfokaNW/giphy.gif" },
            { name: "happy7", url: "https://media.giphy.com/media/l0HlPystfePnAI3G8/giphy.gif" },
            { name: "happy8", url: "https://media.giphy.com/media/3o7aCSPqXE5C6T8tBC/giphy.gif" }
        ]
    },
    love: {
        name: "Tình yêu",
        stickers: [
            { name: "love1", url: "https://media.giphy.com/media/R6gvnAxj2ISzJdbA63/giphy.gif" },
            { name: "love2", url: "https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif" },
            { name: "love3", url: "https://media.giphy.com/media/3oEjI4sFlp73fvEYgw/giphy.gif" },
            { name: "love4", url: "https://media.giphy.com/media/l41JU9pUyosHzWyuQ/giphy.gif" },
            { name: "love5", url: "https://media.giphy.com/media/YpwwoFKZJrE4g/giphy.gif" },
            { name: "love6", url: "https://media.giphy.com/media/l0MYP6WAFfaR7Q1jO/giphy.gif" },
            { name: "love7", url: "https://media.giphy.com/media/26AHPxxnSw1L9T1rW/giphy.gif" },
            { name: "love8", url: "https://media.giphy.com/media/l2Sqir5ZxfoS27EvS/giphy.gif" }
        ]
    },
    sad: {
        name: "Buồn",
        stickers: [
            { name: "sad1", url: "https://media.giphy.com/media/ISOckXUybVfQ4/giphy.gif" },
            { name: "sad2", url: "https://media.giphy.com/media/L95W4wv8nnb9K/giphy.gif" },
            { name: "sad3", url: "https://media.giphy.com/media/26ybwvTX4DTkwst6U/giphy.gif" },
            { name: "sad4", url: "https://media.giphy.com/media/3o85xIO33l7RlmLR4I/giphy.gif" },
            { name: "sad5", url: "https://media.giphy.com/media/3oriO13KTkzPwTykp2/giphy.gif" },
            { name: "sad6", url: "https://media.giphy.com/media/BEob5qwFkSJ7G/giphy.gif" },
            { name: "sad7", url: "https://media.giphy.com/media/26n6ziTEeDDbowBkQ/giphy.gif" },
            { name: "sad8", url: "https://media.giphy.com/media/10tqJ4MVWh9S5G/giphy.gif" }
        ]
    },
    funny: {
        name: "Hài hước",
        stickers: [
            { name: "funny1", url: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif" },
            { name: "funny2", url: "https://media.giphy.com/media/YQitE4YNQNahy/giphy.gif" },
            { name: "funny3", url: "https://media.giphy.com/media/3oz8xLd9DJq2l2VFtu/giphy.gif" },
            { name: "funny4", url: "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" },
            { name: "funny5", url: "https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif" },
            { name: "funny6", url: "https://media.giphy.com/media/3oEjHI8WJv4x6UPDB6/giphy.gif" },
            { name: "funny7", url: "https://media.giphy.com/media/26BRrSvJUa0crqw4E/giphy.gif" },
            { name: "funny8", url: "https://media.giphy.com/media/QBC5foQmcOkdq/giphy.gif" }
        ]
    },
    celebration: {
        name: "Ăn mừng",
        stickers: [
            { name: "party1", url: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif" },
            { name: "party2", url: "https://media.giphy.com/media/3oz8xAFtqoOUUrsh7W/giphy.gif" },
            { name: "party3", url: "https://media.giphy.com/media/26u4lOMA8JKSnL9Uk/giphy.gif" },
            { name: "party4", url: "https://media.giphy.com/media/l0MYzLLxlJDfYtzy0/giphy.gif" },
            { name: "party5", url: "https://media.giphy.com/media/3ohfFhG5VDtDTzQv2o/giphy.gif" },
            { name: "party6", url: "https://media.giphy.com/media/l0MYP6WAFfaR7Q1jO/giphy.gif" },
            { name: "party7", url: "https://media.giphy.com/media/26u4cS6zAgzP3gbd6/giphy.gif" },
            { name: "party8", url: "https://media.giphy.com/media/Is1O1TWV0LEJi/giphy.gif" }
        ]
    },
    animals: {
        name: "Động vật",
        stickers: [
            { name: "cat1", url: "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" },
            { name: "cat2", url: "https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif" },
            { name: "dog1", url: "https://media.giphy.com/media/mCRJDo24UvJMA/giphy.gif" },
            { name: "dog2", url: "https://media.giphy.com/media/26AHPxxnSw1L9T1rW/giphy.gif" },
            { name: "bear1", url: "https://media.giphy.com/media/l0MYC0LajbaPoEADu/giphy.gif" },
            { name: "bear2", url: "https://media.giphy.com/media/l2Sqir5ZxfoS27EvS/giphy.gif" },
            { name: "panda1", url: "https://media.giphy.com/media/H4DjXQXamtTiIuCcRU/giphy.gif" },
            { name: "panda2", url: "https://media.giphy.com/media/10tqJ4MVWh9S5G/giphy.gif" },
            { name: " cat2", url: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExOGc4ajI3cXN0ajJ6Mm96YXhuNXRuMTh4ZDU3bHJkczI0bTdoc2cwbCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o85xoi6nNqJQJ95Qc/giphy.gif" },
        ]
    }
};

const StickerPicker: React.FC<StickerPickerProps> = ({ onStickerSelect, onClose }) => {
    const [activeCategory, setActiveCategory] = React.useState<keyof typeof STICKER_CATEGORIES>('happy');
    const [loading, setLoading] = React.useState<string | null>(null);

    const handleStickerClick = (sticker: { name: string; url: string }) => {
        setLoading(sticker.name);
        onStickerSelect(sticker);
        setTimeout(() => setLoading(null), 500);
    };

    return (
        <div
            style={{
                position: "relative",
                background: "#fff",
                border: "2px solid #e5e7eb",
                borderRadius: "16px",
                boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
                width: "370px",
                maxHeight: "460px",
                overflow: "hidden",
                fontFamily: "'Segoe UI', sans-serif"
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div
                style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f3f4f6",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "#fff"
                }}
            >
                <span style={{ fontWeight: 600, fontSize: "14px" }}>📱 Chọn Sticker GIF</span>
                <button
                    onClick={onClose}
                    style={{
                        background: "rgba(255,255,255,0.2)",
                        border: "none",
                        borderRadius: "6px",
                        color: "#fff",
                        width: "24px",
                        height: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: "12px"
                    }}
                >
                    ×
                </button>
            </div>

            {/* Category Tabs */}
            <div
                style={{
                    display: "flex",
                    borderBottom: "1px solid #f3f4f6",
                    background: "#f9fafb",
                    overflowX: "auto",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none"
                }}
            >
                {Object.entries(STICKER_CATEGORIES).map(([key, category]) => (
                    <button
                        key={key}
                        onClick={() => setActiveCategory(key as keyof typeof STICKER_CATEGORIES)}
                        style={{
                            padding: "8px 12px",
                            border: "none",
                            background: activeCategory === key ? "#667eea" : "transparent",
                            color: activeCategory === key ? "#fff" : "#6b7280",
                            fontSize: "11px",
                            fontWeight: 500,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            borderRadius: activeCategory === key ? "6px 6px 0 0" : "0",
                            margin: activeCategory === key ? "2px 2px 0 2px" : "0",
                            transition: "all 0.2s"
                        }}
                    >
                        {category.name}
                    </button>
                ))}
            </div>

            {/* Sticker Grid */}
            <div
                style={{
                    padding: "12px",
                    maxHeight: "320px",
                    overflowY: "auto",
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "8px"
                }}
            >
                {STICKER_CATEGORIES[activeCategory].stickers.map((sticker) => (
                    <button
                        key={sticker.name}
                        onClick={() => handleStickerClick(sticker)}
                        disabled={loading === sticker.name}
                        style={{
                            background: "none",
                            border: "2px solid transparent",
                            borderRadius: "8px",
                            cursor: loading === sticker.name ? "wait" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "transform 0.1s, border-color 0.2s",
                            aspectRatio: "1",
                            position: "relative",
                            overflow: "hidden"
                        }}
                        onMouseEnter={(e) => {
                            if (loading !== sticker.name) {
                                e.currentTarget.style.borderColor = "#667eea";
                                e.currentTarget.style.transform = "scale(1.05)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "transparent";
                            e.currentTarget.style.transform = "scale(1)";
                        }}
                    >
                        <img
                            src={sticker.url}
                            alt={sticker.name}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: "6px",
                                opacity: loading === sticker.name ? 0.6 : 1
                            }}
                            loading="lazy"
                        />
                        {loading === sticker.name && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    color: "#667eea",
                                    fontSize: "12px"
                                }}
                            >
                                ⏳
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Footer */}
            <div
                style={{
                    padding: "8px 16px",
                    borderTop: "1px solid #f3f4f6",
                    background: "#f9fafb",
                    fontSize: "11px",
                    color: "#6b7280",
                    textAlign: "center"
                }}
            >
                💡 Nhấn vào sticker để gửi GIF động
            </div>
        </div>
    );
};

export default StickerPicker;