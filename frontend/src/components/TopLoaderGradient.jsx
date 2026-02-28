import React from 'react'

export default function TopLoaderGradient({active}) {
    return (
        <div className={`absolute top-[1px] left-0 w-full h-1 z-50 pointer-events-none ${active ? '' : 'hidden'}`}>
            <div className="relative w-full h-full overflow-hidden rounded-full">
                <div
                    className="absolute inset-0 animate-rainbow-gradient"
                    style={{
                        background: 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff, #ff0000)',
                        backgroundSize: '200% 100%',
                    }}
                />
            </div>
        </div>
    )
}
