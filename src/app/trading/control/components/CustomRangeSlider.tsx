import React, { useState, useEffect, useRef } from 'react';

interface CustomRangeSliderProps {
    min: number;
    max: number;
    value: number;
    onChange: (value: number) => void;
    marks?: number[];
    className?: string;
}

export const CustomRangeSlider: React.FC<CustomRangeSliderProps> = ({
    min,
    max,
    value,
    onChange,
    marks = [0, 25, 50, 75, 100],
    className = ""
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseInt(e.target.value);
        onChange(newValue);
    };

    const handleMarkClick = (markValue: number) => {
        onChange(markValue);
    };

    const getActiveMarks = () => {
        return marks.filter(mark => value >= mark);
    };

    const activeMarks = getActiveMarks();
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className={`custom-range-slider ${className}`}>
            <div className="relative w-full h-8">
                {/* Input range */}
                <input
                    ref={inputRef}
                    type="range"
                    min={min}
                    max={max}
                    value={value}
                    onChange={handleInputChange}
                    className="w-[96%] absolute top-4 h-0 appearance-none cursor-pointer z-30"
                    style={{
                        background: 'transparent',
                        outline: 'none'
                    }}
                />
                
                {/* Labels positioned over the slider track */}
                <ul className="range-labels absolute top-3 left-0 right-0 flex justify-between pointer-events-none z-20">
                    {marks.map((mark) => {
                        const isActive = activeMarks.includes(mark);
                        const isSelected = value >= mark;
                        
                        return (
                            <li
                                key={mark}
                                className={`relative flex flex-col items-center transition-colors duration-200 ${
                                    isActive ? 'text-[#37adbf]' : 'text-[#b2b2b2]'
                                }`}
                            >
                                <div
                                    className={`w-2 h-2 rounded-full transition-all duration-200 pointer-events-auto cursor-pointer hover:scale-125 mb-2 ${
                                        isSelected 
                                            ? 'bg-[#37adbf]' 
                                            : 'bg-[#b2b2b2]'
                                    }`}
                                    onClick={() => handleMarkClick(mark)}
                                />
                                <span className="text-xs font-medium pointer-events-auto cursor-pointer hover:scale-110 transition-transform"
                                      onClick={() => handleMarkClick(mark)}>
                                    {mark}%
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                                         .custom-range-slider input::-webkit-slider-thumb {
                         -webkit-appearance: none;
                         width: 8px;
                         height: 8px;
                         margin: -4px 0 0;
                         border-radius: 50%;
                         background: #37adbf;
                         cursor: pointer;
                         border: 0 !important;
                         box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                     }

                     .custom-range-slider input::-moz-range-thumb {
                         width: 8px;
                         height: 8px;
                         margin: -4px 0 0;
                         border-radius: 50%;
                         background: #37adbf;
                         cursor: pointer;
                         border: 0 !important;
                         box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                     }

                     .custom-range-slider input::-ms-thumb {
                         width: 8px;
                         height: 8px;
                         margin: -4px 0 0;
                         border-radius: 50%;
                         background: #37adbf;
                         cursor: pointer;
                         border: 0 !important;
                         box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                     }

                    .custom-range-slider input::-webkit-slider-runnable-track {
                        width: 100%;
                        height: 2px;
                        cursor: pointer;
                        background: linear-gradient(to right, #37adbf 0%, #37adbf ${percentage}%, #b2b2b2 ${percentage}%, #b2b2b2 100%);
                        border-radius: 1px;
                    }

                    .custom-range-slider input::-moz-range-track {
                        width: 100%;
                        height: 2px;
                        cursor: pointer;
                        background: linear-gradient(to right, #37adbf 0%, #37adbf ${percentage}%, #b2b2b2 ${percentage}%, #b2b2b2 100%);
                        border-radius: 1px;
                    }

                    .custom-range-slider input::-ms-track {
                        width: 100%;
                        height: 2px;
                        cursor: pointer;
                        background: linear-gradient(to right, #37adbf 0%, #37adbf ${percentage}%, #b2b2b2 ${percentage}%, #b2b2b2 100%);
                        border-color: transparent;
                        color: transparent;
                    }

                    .custom-range-slider input:focus {
                        background: none;
                        outline: none;
                    }

                    .range-labels li:hover {
                        transform: scale(1.1);
                    }
                `
            }} />
        </div>
    );
}; 