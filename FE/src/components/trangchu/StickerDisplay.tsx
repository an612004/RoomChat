import React from "react";

interface StickerDisplayProps {
    stickers: Array<{ url: string; name: string }>;
    size?: "small" | "medium" | "large";
}

const StickerDisplay: React.FC<StickerDisplayProps> = ({ stickers, size = "medium" }) => {
    console.log('🎨 StickerDisplay render:', { stickers, size, length: stickers?.length });
    if (!stickers || stickers.length === 0) {
        console.log('⚠️ No stickers to display');
        return null;
    }

    const sizeMap = {
        small: { width: 32, height: 32 },
        medium: { width: 56, height: 56 },
        large: { width: 80, height: 80 }
    };

    const dimensions = sizeMap[size];

    return (
        <div
            style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "4px",
                marginTop: "4px"
            }}
        >
            {stickers.map((sticker, index) => (
                <img
                    key={index}
                    src={sticker.url}
                    alt={sticker.name}
                    style={{
                        width: dimensions.width,
                        height: dimensions.height,
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "2px solid #e5e7eb",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                        cursor: "pointer",
                        transition: "transform 0.2s, border-color 0.2s, box-shadow 0.2s"
                    }}
                    onMouseEnter={(e) => {
                        const img = e.currentTarget;
                        img.style.transform = "scale(1.1)";
                        img.style.borderColor = "#6366f1";
                        img.style.boxShadow = "0 4px 12px rgba(99,102,241,0.2)";
                    }}
                    onMouseLeave={(e) => {
                        const img = e.currentTarget;
                        img.style.transform = "scale(1)";
                        img.style.borderColor = "#e5e7eb";
                        img.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
                    }}
                    loading="lazy"
                    onError={(e) => {
                        // Fallback nếu GIF không load được
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                    }}
                />
            ))}
        </div>
    );
};

export default StickerDisplay;