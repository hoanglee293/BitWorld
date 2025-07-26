import React from 'react'
import { Check, Pencil } from 'lucide-react'

interface PercentageButtonsProps {
    percentageValues: number[]
    percentage: number
    onSetPercentage: (percent: number) => void
    onEditClick: (index: number) => void
    onEditSave: (index: number) => void
    editingIndex: number | null
    editValue: string
    setEditValue: (value: string) => void
    onEditKeyPress: (e: React.KeyboardEvent, index: number) => void
}

export const PercentageButtons: React.FC<PercentageButtonsProps> = ({
    percentageValues,
    percentage,
    onSetPercentage,
    onEditClick,
    onEditSave,
    editingIndex,
    editValue,
    setEditValue,
    onEditKeyPress,
}) => {
    return (
        <div className="flex items-center justify-around gap-[6%]">
            {percentageValues.map((percent, index) => (
                <div key={index} className="relative w-full text-center">
                    <button
                        onClick={() => onSetPercentage(percent)}
                        className={`w-full 2xl:px-[4px] px-1 py-1 h-[30px] text-center font-semibold text-[10px] rounded-md flex items-center justify-center gap-1 border border-solid transition-colors ${percentage === percent
                                ? "border-blue-500 text-blue-600 dark:border-linear-start bg-blue-50 dark:bg-theme-primary-400/10"
                                : "border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800"
                            }`}
                    >
                        {percent}%
                    </button>
                </div>
            ))}
        </div>
    )
} 
