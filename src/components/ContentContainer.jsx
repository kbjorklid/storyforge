import React from 'react';

const ContentContainer = ({ children, maxWidth = '1000px' }) => {
    return (
        <div style={{
            width: '100%',
            maxWidth: maxWidth,
            margin: '0 auto',
            padding: '0 1rem'
        }}>
            {children}
        </div>
    );
};

export default ContentContainer;
