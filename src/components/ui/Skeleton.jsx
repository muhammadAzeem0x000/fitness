import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export function SkeletonCard({ count = 1 }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                        <Skeleton width={120} height={20} baseColor="#27272a" highlightColor="#3f3f46" />
                        <Skeleton circle width={40} height={40} baseColor="#27272a" highlightColor="#3f3f46" />
                    </div>
                    <Skeleton height={32} width={80} className="mb-2" baseColor="#27272a" highlightColor="#3f3f46" />
                    <Skeleton width={60} height={16} baseColor="#27272a" highlightColor="#3f3f46" />
                </div>
            ))}
        </>
    );
}

export function SkeletonList({ rows = 5 }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <Skeleton circle width={40} height={40} baseColor="#27272a" highlightColor="#3f3f46" />
                    <div className="flex-1">
                        <Skeleton width="60%" height={16} className="mb-1" baseColor="#27272a" highlightColor="#3f3f46" />
                        <Skeleton width="40%" height={12} baseColor="#27272a" highlightColor="#3f3f46" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function SkeletonChart() {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <Skeleton width={150} height={20} className="mb-4" baseColor="#27272a" highlightColor="#3f3f46" />
            <div className="h-64 flex items-end justify-between gap-2">
                {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton
                        key={i}
                        height={Math.random() * 200 + 50}
                        className="flex-1"
                        baseColor="#27272a"
                        highlightColor="#3f3f46"
                    />
                ))}
            </div>
        </div>
    );
}

export function SkeletonText({ lines = 3 }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    width={i === lines - 1 ? '70%' : '100%'}
                    height={16}
                    baseColor="#27272a"
                    highlightColor="#3f3f46"
                />
            ))}
        </div>
    );
}
