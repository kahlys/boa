import React from 'react';

interface ArrayInputProps {
    values: string[];
    inputValue: string;
    onInputChange: (value: string) => void;
    onKeyPress: (e: React.KeyboardEvent) => void;
    onRemove: (index: number) => void;
    placeholder?: string;
}

export const ArrayInput: React.FC<ArrayInputProps> = ({
    values,
    inputValue,
    onInputChange,
    onKeyPress,
    onRemove,
    placeholder = 'Press Enter to add',
}) => {
    return (
        <div className="array-input-container">
            {values.map((value, index) => (
                <div key={index} className="badge-tag">
                    {value}
                    <button
                        type="button"
                        onClick={() => onRemove(index)}
                    >
                        ×
                    </button>
                </div>
            ))}
            <input
                type="text"
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyPress={onKeyPress}
                placeholder={placeholder}
            />
        </div>
    );
};
