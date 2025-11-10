import React, { useState, useEffect, useRef } from 'react';
import './VerifiedBadge.css';

interface VerifiedBadgeProps {
    isVerified?: boolean;
    size?: 'small' | 'medium' | 'large';
}

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ isVerified, size = 'medium' }) => {
    if (!isVerified) return null;

    const [showTooltip, setShowTooltip] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const sizeMap = {
        small: 14,
        medium: 18,
        large: 22
    };

    const iconSize = sizeMap[size];

    // Handle hover with delay
    const handleMouseEnter = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        hoverTimeoutRef.current = setTimeout(() => {
            setShowTooltip(true);
        }, 300); // 300ms delay
    };

    const handleMouseLeave = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        // Don't auto-hide on mouse leave - only hide on click outside
    };

    // Click anywhere to close tooltip
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showTooltip && tooltipRef.current) {
                const target = event.target as Element;

                // Close tooltip unless clicking inside the tooltip itself
                if (!tooltipRef.current.contains(target)) {
                    setShowTooltip(false);
                }
            }
        };

        if (showTooltip) {
            // Add slight delay to prevent immediate close after opening
            setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
            }, 100);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showTooltip]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, []);

    // Auto-adjust tooltip position if it goes off screen
    useEffect(() => {
        if (showTooltip && tooltipRef.current) {
            const tooltip = tooltipRef.current;
            const arrow = tooltip.querySelector('div:last-child') as HTMLElement;

            // Get the icon position to calculate available space
            const iconRect = tooltip.parentElement?.getBoundingClientRect();
            const tooltipWidth = 300; // Fixed width of tooltip
            const margin = 12; // Margin from icon

            if (iconRect) {
                const spaceOnRight = window.innerWidth - iconRect.right - margin;

                // If not enough space on right, move to left
                if (spaceOnRight < tooltipWidth) {
                    tooltip.style.left = 'auto';
                    tooltip.style.right = 'calc(100% + 12px)';
                    tooltip.style.animation = 'fadeInLeft 0.2s ease-out';

                    if (arrow) {
                        arrow.style.left = 'auto';
                        arrow.style.right = '-10px';
                        arrow.style.borderRight = 'none';
                        arrow.style.borderLeft = '10px solid #ffffff';
                        arrow.style.filter = 'drop-shadow(2px 0 4px rgba(0,0,0,0.1))';
                    }
                }
            }
        }
    }, [showTooltip]);

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
                src="/tich-xanh-icon.png"
                alt="Tài khoản đã xác minh"
                className="verified-badge-icon"
                onError={(e) => {
                    // Fallback to SVG if PNG not found
                    (e.target as HTMLImageElement).src = "/tich-xanh-icon.svg";
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowTooltip(!showTooltip);
                }}
                style={{
                    width: `${iconSize}px`,
                    height: `${iconSize}px`,
                    marginLeft: '4px',
                    verticalAlign: 'middle',
                    flexShrink: 0
                }}
            />

            {showTooltip && (
                <div
                    ref={tooltipRef}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    className="verified-tooltip"
                    style={{
                        position: 'absolute',
                        left: 'calc(100% + 12px)',
                        top: '600%',
                        transform: 'translateY(-50%)',
                        background: '#ffffff',
                        border: '1px solid #dadde1',
                        borderRadius: '8px',
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
                        padding: '16px',
                        width: '300px',
                        zIndex: 999999,
                        fontSize: '14px',
                        lineHeight: '1.4',
                        color: '#1c1e21',
                        animation: 'fadeInRight 0.2s ease-out'
                    }}
                >
                    {/* Blue checkmark icon */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            background: 'linear-gradient(135deg, #1877f2, #42a5f5)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 2px 8px rgba(24, 119, 242, 0.3)'
                        }}>
                            <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontWeight: '600',
                                marginBottom: '6px',
                                fontSize: '15px',
                                color: '#1c1e21'
                            }}>
                                Tài khoản đã xác minh
                            </div>
                            <div style={{
                                color: '#65676b',
                                fontSize: '13px',
                                lineHeight: '1.5',
                                maxWidth: '260px',
                                wordWrap: 'break-word',
                                whiteSpace: 'normal',
                                textAlign: 'left'
                            }}>
                                Tài khoản có huy hiệu đã được xác minh đã được xác thực
                                và có thể là người đăng ký Anbi Verified
                                hoặc là cá nhân hoặc thương hiệu nổi tiếng.
                            </div>

                        </div>
                    </div>

                    {/* Tooltip arrow */}
                    <div
                        style={{
                            position: 'absolute',
                            left: '-10px',
                            top: '10px',
                            width: 0,
                            height: 0,
                            borderTop: '10px solid transparent',
                            borderBottom: '10px solid transparent',
                            borderRight: '10px solid #ffffff',
                            filter: 'drop-shadow(-2px 0 4px rgba(0,0,0,0.1))'
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default VerifiedBadge;