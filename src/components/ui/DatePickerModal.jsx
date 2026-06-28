import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './Button';
import { hapticLight } from '../../lib/haptics';

function getLocalDateString(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function DatePickerModal({ isOpen, onClose, selectedDate, onSelectDate }) {
    const [currentMonth, setCurrentMonth] = useState(() => new Date(selectedDate + 'T12:00:00'));

    useEffect(() => {
        if (isOpen) {
            setCurrentMonth(new Date(selectedDate + 'T12:00:00'));
        }
    }, [isOpen, selectedDate]);

    if (!isOpen) return null;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const todayObj = new Date();
    const todayStr = getLocalDateString(todayObj);

    const prevMonth = () => { hapticLight(); setCurrentMonth(new Date(year, month - 1, 1)); };
    const nextMonth = () => { hapticLight(); setCurrentMonth(new Date(year, month + 1, 1)); };

    const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    const cells = [];
    for (let i = 0; i < firstDay; i++) {
        cells.push({ empty: true, key: `empty-${i}` });
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = getLocalDateString(date);
        
        const isToday = dateStr === todayStr;
        const isSelected = dateStr === selectedDate;
        
        cells.push({ day, dateStr, key: dateStr, isToday, isSelected });
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-[320px] shadow-xl border border-slate-100 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-zinc-800">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-violet-500" /> Select Date
                    </h3>
                    <button onClick={() => { hapticLight(); onClose(); }} className="p-2 -mr-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{monthName}</span>
                        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <div key={i} className="text-center text-xs font-semibold text-slate-400 dark:text-zinc-500 py-1">
                                {d}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {cells.map((cell) => {
                            if (cell.empty) return <div key={cell.key} className="aspect-square" />;
                            return (
                                <button
                                    key={cell.key}
                                    onClick={() => {
                                        hapticLight();
                                        onSelectDate(cell.dateStr);
                                        onClose();
                                    }}
                                    className={`aspect-square rounded-full flex items-center justify-center text-sm transition-all
                                        ${cell.isSelected ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-500/30' 
                                        : cell.isToday ? 'bg-slate-100 dark:bg-zinc-800 text-violet-600 dark:text-violet-400 font-bold' 
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800'}
                                    `}
                                >
                                    {cell.day}
                                </button>
                            );
                        })}
                    </div>
                </div>
                
                <div className="p-4 border-t border-slate-100 dark:border-zinc-800">
                    <Button 
                        variant="outline" 
                        className="w-full h-11 rounded-xl"
                        onClick={() => {
                            hapticLight();
                            onSelectDate(todayStr);
                            onClose();
                        }}
                    >
                        Go to Today
                    </Button>
                </div>
            </div>
        </div>
    );
}
