import React, { useState, useRef } from 'react';
import { Range } from 'react-range';

interface CustomRangeSliderProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    marks?: number[];
    disabled?: boolean;
    className?: string;
}

export const CustomRangeSlider: React.FC<CustomRangeSliderProps> = ({
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    marks = [0, 25, 50, 75, 100],
    disabled = false,
    className = ''
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);

    const handleMarkClick = (markValue: number) => {
        if (disabled) return;
        onChange(markValue);
    };

    const handleTrackClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (disabled || !trackRef.current) return;

        const rect = trackRef.current.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const trackWidth = rect.width;
        const percentage = (clickX / trackWidth) * 100;
        const newValue = Math.round((percentage / 100) * max);

        // Snap to nearest mark if within 10% of a mark
        const nearestMark = marks.reduce((prev, curr) =>
            Math.abs(curr - newValue) < Math.abs(prev - newValue) ? curr : prev
        );

        if (Math.abs(nearestMark - newValue) <= 10) {
            onChange(nearestMark);
        } else {
            onChange(Math.max(min, Math.min(max, newValue)));
        }
    };

    // Find the closest mark to current value for visual feedback
    const getClosestMark = (currentValue: number): number => {
        return marks.reduce((prev, curr) =>
            Math.abs(curr - currentValue) < Math.abs(prev - currentValue) ? curr : prev
        );
    };

    const closestMark = getClosestMark(value);

    return (
        <div className={`w-full ${className}`}>
            {/* Custom marks positioned absolutely */}
            <div className="relative mb-4">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-[99%] input-range absolute top-0 left-[1px] z-20"
                />
                <div className="flex justify-between relative">
                    {marks.map((mark) => {
                        const isActive = value >= mark;
                        const isClosest = mark === closestMark;

                        return (
                            <div key={mark} className="flex flex-col items-center relative z-10">
                                {/* Mark circle - clickable */}
                                <button
                                    onClick={() => handleMarkClick(mark)}
                                    disabled={disabled}
                                    className={`w-4 h-4 rounded-full mb-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 ${disabled
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:scale-125 cursor-pointer'
                                        } ${isActive
                                            ? 'bg-[#00589C] dark:bg-[#00589C] border-2 border-[#00589C] dark:border-[#00589C] shadow-lg'
                                            : isClosest && value > 0
                                                ? 'bg-gray-500 dark:bg-gray-600 border border-gray-400 dark:border-gray-500'
                                                : 'bg-gray-600 dark:bg-gray-700 hover:bg-gray-500 dark:hover:bg-gray-600'
                                        }`}
                                />
                                {/* Mark label */}
                                <span onClick={() => handleMarkClick(mark)} className={`text-xs font-medium transition-colors duration-200 cursor-pointer ${isActive
                                        ? 'text-cyan-400 dark:text-cyan-300'
                                        : 'text-white dark:text-gray-200'
                                    } ${disabled ? 'opacity-50' : ''}`}>
                                    {mark}%
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Track line behind marks - clickable */}
                <div
                    ref={trackRef}
                    onClick={handleTrackClick}
                    className={`absolute top-1.5 left-0 right-0 h-0.5 bg-gray-600 dark:bg-gray-700 -z-10 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                />

                {/* Progress fill */}
                <div
                    className="absolute top-1.5 left-0 h-0.5 bg-blue-600 dark:bg-blue-500 -z-10 transition-all duration-300 ease-out"
                    style={{
                        width: `${(value / max) * 100}%`,
                    }}
                />
            </div>

            {/* Hidden range input for accessibility and drag functionality */}
            <Range
                step={step}
                min={min}
                max={max}
                values={[value]}
                onChange={(values) => onChange(values[0])}
                onFinalChange={(values) => {
                    setIsDragging(false);
                    onChange(values[0]);
                }}
                disabled={disabled}
                renderTrack={({ props, children }) => (
                    <div
                        {...props}
                        className="w-full h-8 relative opacity-0"
                        style={{
                            ...props.style,
                        }}
                    >
                        {children}
                    </div>
                )}
                renderThumb={({ props }) => (
                    <div
                        {...props}
                        className="w-4 h-4 bg-transparent"
                        style={{
                            ...props.style,
                        }}
                    />
                )}
            />
        </div>
    );
}; 