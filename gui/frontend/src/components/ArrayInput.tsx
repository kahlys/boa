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
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                padding: '6px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                backgroundColor: 'white',
                alignItems: 'center',
            }}
        >
            {values.map((value, index) => (
                <div
                    key={index}
                    style={{
                        backgroundColor: '#adb5bd',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {value}
                    <button
                        type="button"
                        onClick={() => onRemove(index)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '16px',
                            padding: '0',
                            lineHeight: '1',
                        }}
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
                style={{
                    border: 'none',
                    outline: 'none',
                    flex: 1,
                    minWidth: '150px',
                    padding: '0',
                    fontSize: '14px',
                }}
                placeholder={placeholder}
            />
        </div>
    );
};
