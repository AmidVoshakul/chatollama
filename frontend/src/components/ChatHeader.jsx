// frontend/src/components/ChatHeader.jsx
import React from 'react';


export default function ChatHeader({title}) {
    return (
        <div className="border-b border-gray-700 pb-2">
            <h2 className="text-xl">{title}</h2>
        </div>
    );
}
