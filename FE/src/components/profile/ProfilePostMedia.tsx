import React from 'react';

interface ProfilePostMediaProps {
  images?: string[];
  videos?: string[];
}

const ProfilePostMedia: React.FC<ProfilePostMediaProps> = ({ 
  images, 
  videos 
}) => {
  return (
    <>
      {/* Images */}
      {images && images.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gap: 8, 
          margin: '18px 0 0 0', 
          gridTemplateColumns: images.length === 1 ? '1fr' : images.length === 2 ? '1fr 1fr' : '2fr 1fr', 
          gridTemplateRows: images.length <= 2 ? '1fr' : images.length === 3 ? '1fr 1fr' : '1fr 1fr', 
          gridAutoFlow: 'dense', 
          justifyContent: 'center', 
          alignItems: 'center', 
          maxWidth: '700px', 
          minHeight: '340px', 
          position: 'relative' 
        }}>
          {images.map((img: string, idx: number) => {
            const src = img.startsWith('/uploads/') ? `http://localhost:3000${img}` : img;
            let style: React.CSSProperties = {
              width: '100%',
              height: images.length === 1 ? '420px' : images.length === 2 ? '340px' : idx === 0 ? '340px' : '165px',
              objectFit: 'cover',
              borderRadius: 16,
              boxShadow: '0 4px 24px #b6b8c355',
              cursor: 'zoom-in',
              gridColumn: images.length === 1 ? '1/2' : images.length === 2 ? (idx === 0 ? '1/2' : '2/3') : (idx === 0 ? '1/2' : '2/3'),
              gridRow: images.length <= 2 ? '1/2' : (idx === 0 ? '1/3' : (idx === 1 ? '1/2' : '2/3')),
              position: 'relative',
            };
            if (idx > 3) return null;
            return (
              <img 
                key={idx} 
                className="post-img" 
                src={src} 
                alt={`post-img-${idx}`} 
                style={style} 
              />
            );
          })}
        </div>
      )}
      
      {/* Videos */}
      {videos && videos.length > 0 && (
        <div style={{ 
          display: 'flex', 
          gap: 16, 
          margin: '18px 0 0 0', 
          flexWrap: 'wrap', 
          justifyContent: 'center' 
        }}>
          {videos.map((vid: string, idx: number) => {
            const src = vid.startsWith('/uploads/') ? `http://localhost:3000${vid}` : vid;
            return (
              <video 
                key={idx} 
                src={src} 
                controls 
                style={{ 
                  width: 340, 
                  height: 340, 
                  borderRadius: 16, 
                  boxShadow: '0 4px 24px #b6b8c355', 
                  background: '#000' 
                }} 
              />
            );
          })}
        </div>
      )}
    </>
  );
};

export default ProfilePostMedia;