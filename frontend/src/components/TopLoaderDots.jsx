import React from 'react'

export default function TopLoaderDots({active}) {
    return (
        <div className={`absolute top-[5px] left-0 w-full h-2 z-50 pointer-events-none ${active ? '' : 'hidden'}`}>
            <div className="relative w-full h-full overflow-hidden">
                {[...Array(5)].map((_, i) => (
                    <span
                        key={i}
                        className="absolute top-0 w-1.5 h-1.5 rounded-full opacity-0 animate-dot-trail"
                        style={{
                            animationDelay: `${i * 0.25}s`,
                            animationFillMode: 'forwards',
                            left: 0,
                            backgroundImage: 'linear-gradient(to right, #7c3aed, #6366f1)', // purple to indigo
                            backgroundSize: '200% 200%',
                            backgroundPosition: 'center',
                        }}
                    />
                ))}
            </div>
        </div>
    )
}
