import React from 'react';

interface BooleanSwitchProps {
    value: boolean;
    onChange: (value: boolean) => void;
    label?: string;
}

export const BooleanSwitch: React.FC<BooleanSwitchProps> = ({
    value,
    onChange,
    label,
}) => {
    return (
        <div className="form-check form-switch">
            <input
                className="form-check-input"
                type="checkbox"
                checked={value}
                onChange={(e) => onChange(e.target.checked)}
                id="booleanSwitch"
            />
            {label && <label className="form-check-label" htmlFor="booleanSwitch">{label}</label>}
        </div>
    );
};
