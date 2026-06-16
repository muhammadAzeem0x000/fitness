import React, { useEffect } from 'react';
import { X, PlayCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { getExerciseVideoUrl } from '../../lib/exerciseVideos';

export function VideoGuideModal({ isOpen, onClose, exerciseName }) {
    // Prevent background scrolling when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const videoUrl = getExerciseVideoUrl(exerciseName);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            {/* Modal Container */}
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl shadow-2xl shadow-blue-900/10 w-full max-w-4xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800/50 bg-zinc-900/50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <PlayCircle className="w-4 h-4 text-blue-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white tracking-tight">
                            {exerciseName} <span className="text-zinc-500 font-medium">Guide</span>
                        </h3>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full h-8 w-8"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Video Container or Fallback */}
                <div className="relative w-full bg-zinc-950 aspect-video flex items-center justify-center">
                    {videoUrl ? (
                        <iframe
                            src={videoUrl}
                            title={`${exerciseName} Video Guide`}
                            className="absolute inset-0 w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        ></iframe>
                    ) : (
                        <div className="text-center p-6 max-w-md animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                                <PlayCircle className="w-8 h-8 text-zinc-600" />
                            </div>
                            <h4 className="text-xl font-bold text-white mb-2">Video Not Available</h4>
                            <p className="text-zinc-400 text-sm mb-6">
                                We are still sourcing a high-quality, short-form premium guide for <span className="text-white font-medium">{exerciseName}</span>. 
                            </p>
                            <a 
                                href={`https://www.youtube.com/results?search_query=how+to+do+${encodeURIComponent(exerciseName)}+exercise+guide+muscle+and+strength`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-red-900/20"
                            >
                                <PlayCircle className="w-5 h-5" />
                                Search YouTube Instead
                            </a>
                        </div>
                    )}
                </div>

                {/* Footer/Info */}
                <div className="p-4 bg-zinc-900/30 border-t border-zinc-800/50 text-sm text-zinc-400 flex items-center justify-between">
                    <p>Powered by YouTube. Watch the full tutorial for detailed cues.</p>
                    <Button variant="outline" size="sm" onClick={onClose} className="hidden sm:flex border-zinc-700 hover:bg-zinc-800">
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}
