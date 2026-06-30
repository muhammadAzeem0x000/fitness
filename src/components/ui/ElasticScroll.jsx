import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';

/**
 * ElasticScroll
 * Replaces native scroll with a Framer Motion drag container to provide
 * an iOS-style elastic bounce effect on all platforms, including Android.
 * 
 * Uses useMotionValue to bypass React's render cycle for maximum 60fps performance.
 */
export function ElasticScroll({ children, className = "" }) {
    const containerRef = useRef(null);
    const contentRef = useRef(null);
    const [constraints, setConstraints] = useState({ top: 0, bottom: 0 });
    const y = useMotionValue(0);

    // Recalculate scroll boundaries when content or window changes
    useEffect(() => {
        const updateConstraints = () => {
            if (containerRef.current && contentRef.current) {
                const containerHeight = containerRef.current.offsetHeight;
                const contentHeight = contentRef.current.offsetHeight;
                
                // If content is shorter than container, no scrolling needed
                if (contentHeight <= containerHeight) {
                    setConstraints({ top: 0, bottom: 0 });
                } else {
                    setConstraints({ 
                        top: -(contentHeight - containerHeight), 
                        bottom: 0 
                    });
                }
            }
        };

        // Initial calculation
        updateConstraints();

        // Observe resize events to dynamically update scroll bounds
        const resizeObserver = new ResizeObserver(updateConstraints);
        if (contentRef.current) resizeObserver.observe(contentRef.current);
        if (containerRef.current) resizeObserver.observe(containerRef.current);

        return () => resizeObserver.disconnect();
    }, [children]);

    // Handle Desktop Mouse Wheel
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let wheelTimeout;

        const handleWheel = (e) => {
            // Prevent default native scroll
            if (e.cancelable) e.preventDefault();
            
            const currentY = y.get();
            let newY = currentY - e.deltaY;

            // Apply rubber-band resistance if scrolled out of bounds
            if (newY > 0) {
                newY = newY * 0.3; // Resistance at top
            } else if (newY < constraints.top) {
                newY = constraints.top + (newY - constraints.top) * 0.3; // Resistance at bottom
            }

            y.set(newY);

            // Snap back after wheel ends
            clearTimeout(wheelTimeout);
            wheelTimeout = setTimeout(() => {
                const finalY = y.get();
                if (finalY > 0) {
                    animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
                } else if (finalY < constraints.top) {
                    animate(y, constraints.top, { type: 'spring', stiffness: 300, damping: 30 });
                }
            }, 100);
        };

        // Passive: false is required to preventDefault
        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleWheel);
            clearTimeout(wheelTimeout);
        };
    }, [y, constraints]);

    return (
        <div ref={containerRef} className={`w-full h-full overflow-hidden ${className}`}>
            <motion.div
                ref={contentRef}
                style={{ y }}
                drag="y"
                dragDirectionLock
                dragConstraints={constraints}
                dragElastic={0.2}
                dragMomentum={true}
                dragTransition={{ bounceStiffness: 300, bounceDamping: 25 }}
                className="w-full min-h-full"
            >
                {children}
            </motion.div>
        </div>
    );
}
