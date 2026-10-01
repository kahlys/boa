import React, { useState, useEffect } from 'react';
import { main } from '../../wailsjs/go/models';
import { ExecuteWithInput } from '../../wailsjs/go/main/App';

type CommandComplete = main.CommandComplete;
type Flag = main.Flag;

interface DetailPageProps {
    cmd: CommandComplete | null;
    menuInput1: string;
    menuInput2: string;
    onBack: () => void;
    onCommandClick: (commandPath: string) => void;
}

export const DetailPage: React.FC<DetailPageProps> = ({
    cmd,
    menuInput1,
    menuInput2,
    onBack,
    onCommandClick,
}) => {
    const [argsValues, setArgsValues] = useState<string[]>([]);
    const [argsInputValue, setArgsInputValue] = useState<string>('');
    const [flagValues, setFlagValues] = useState<Record<string, any>>({});
    const [flagInputValues, setFlagInputValues] = useState<Record<string, string>>({});
    const [output, setOutput] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);

    // Initialize flag values when command changes
    useEffect(() => {
        console.log('DetailPage: cmd changed', cmd);
        const flags = cmd?.Flags || [];
        const initialized: Record<string, any> = {};
        const inputValues: Record<string, string> = {};
        flags.forEach((flag) => {
            if (flag.Type === 'bool') {
                initialized[flag.Name] = false;
            } else if (flag.Type === 'array') {
                initialized[flag.Name] = [];
                inputValues[flag.Name] = '';
            } else {
                initialized[flag.Name] = '';
            }
        });
        console.log('DetailPage: initialized flags', initialized);
        setFlagValues(initialized);
        setFlagInputValues(inputValues);
        // Reset args and output when changing commands
        setArgsValues([]);
        setArgsInputValue('');
        setOutput('');
        setError('');
    }, [cmd]);

    const handleArgsInputChange = (value: string) => {
        setArgsInputValue(value);
    };

    const handleArgsKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && argsInputValue.trim()) {
            e.preventDefault();
            setArgsValues([...argsValues, argsInputValue.trim()]);
            setArgsInputValue('');
        }
    };

    const removeArg = (index: number) => {
        setArgsValues(argsValues.filter((_, i) => i !== index));
    };

    const handleFlagChange = (flagName: string, value: any) => {
        setFlagValues((prev) => ({
            ...prev,
            [flagName]: value,
        }));
    };

    const handleFlagArrayInputChange = (flagName: string, value: string) => {
        setFlagInputValues((prev) => ({
            ...prev,
            [flagName]: value,
        }));
    };

    const handleFlagArrayKeyPress = (e: React.KeyboardEvent, flagName: string) => {
        if (e.key === 'Enter' && flagInputValues[flagName]?.trim()) {
            e.preventDefault();
            setFlagValues((prev) => ({
                ...prev,
                [flagName]: [...(prev[flagName] as string[]), flagInputValues[flagName].trim()],
            }));
            setFlagInputValues((prev) => ({
                ...prev,
                [flagName]: '',
            }));
        }
    };

    const removeFlagArrayValue = (flagName: string, index: number) => {
        setFlagValues((prev) => ({
            ...prev,
            [flagName]: (prev[flagName] as string[]).filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setOutput('');
        setError('');

        try {
            if (!cmd) {
                setError('No command selected');
                return;
            }

            // Use the submitted args values
            const args = argsValues;

            // Call Go backend with structured data - it handles flag building
            const result = await ExecuteWithInput(cmd.Path, args, flagValues);
            setOutput(result || 'Command executed successfully');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };
    return (
        <>
            {/* DEBUG INFO */}
            <div style={{ padding: '12px', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', marginBottom: '20px', fontSize: '12px', fontFamily: 'monospace' }}>
                <strong>Debug Info:</strong>
                <div>cmd.Name: {cmd?.Name || 'NULL'}</div>
                <div>cmd.Path: {cmd?.Path || 'NULL'}</div>
                <div>cmd.IsRunnable: {cmd?.IsRunnable === undefined ? 'UNDEFINED' : String(cmd?.IsRunnable)}</div>
                <div>cmd.Flags count: {cmd?.Flags?.length || 0}</div>
                <div>cmd.SubCommands count: {cmd?.SubCommands?.length || 0}</div>
                {cmd?.Short && <div>cmd.Short: {cmd.Short}</div>}
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'baseline', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>{cmd?.Name}</h3>
                <p style={{ margin: 0 }}>{cmd?.Short}</p>
            </div>

            {(cmd?.SubCommands || []).map((subCmd, index) => (
                <button
                    key={index}
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => onCommandClick(subCmd.Path)}
                >
                    {subCmd.Name}
                </button>
            ))}
            <button className="btn btn-sm btn-outline-primary" type="button" onClick={onBack} >all</button>

            {cmd?.IsRunnable && (
                <>
                    <form onSubmit={handleSubmit}>
                        {/* Positional arguments */}
                        {/* {cmd?.Args !== '' && ( */}
                            <div style={{ backgroundColor: '#e9ecef', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                                <div>
                                    <label htmlFor="args-container" style={{ fontWeight: '600', marginBottom: '12px', display: 'block' }}>Args</label>
                                </div>
                                <div id="args-container">
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
                                        {argsValues.map((value, index) => (
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
                                                    onClick={() => removeArg(index)}
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
                                            value={argsInputValue}
                                            onChange={(e) => handleArgsInputChange(e.target.value)}
                                            onKeyPress={handleArgsKeyPress}
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                flex: 1,
                                                minWidth: '150px',
                                                padding: '0',
                                                fontSize: '14px',
                                            }}
                                            placeholder="positional argument (press Enter to add)"
                                        />
                                    </div>
                                </div>
                            </div>
                        {/* )} */}

                        {/* Flags */}
                        <div style={{ backgroundColor: '#e9ecef', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                            <label style={{ fontWeight: '600', marginBottom: '12px', display: 'block' }}>
                                Flags
                            </label>
                            {(cmd?.Flags || []).map((flag: Flag) => (
                                <div key={flag.Name} style={{ marginBottom: '16px', paddingBottom: '8px' }}>
                                    <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                                        {flag.Name}
                                    </label>

                                    {flag.Type === 'bool' ? (
                                        <div style={{ display: 'flex', gap: '16px' }}>
                                            <div>
                                                <input
                                                    type="radio"
                                                    id={`${flag.Name}-on`}
                                                    name={`flag-${flag.Name}`}
                                                    checked={flagValues[flag.Name] === true}
                                                    onChange={() => handleFlagChange(flag.Name, true)}
                                                    className="form-check-input"
                                                />
                                                <label htmlFor={`${flag.Name}-on`}>
                                                    on
                                                </label>
                                            </div>
                                            <div>
                                                <input
                                                    type="radio"
                                                    id={`${flag.Name}-off`}
                                                    name={`flag-${flag.Name}`}
                                                    checked={flagValues[flag.Name] === false}
                                                    onChange={() => handleFlagChange(flag.Name, false)}
                                                    className="form-check-input"
                                                />
                                                <label htmlFor={`${flag.Name}-off`}>
                                                    off
                                                </label>
                                            </div>
                                        </div>
                                    ) : flag.Type === 'array' ? (
                                        <>
                                            <div id={`flag-${flag.Name}-container`}>
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
                                                    {((flagValues[flag.Name] || []) as string[]).map((value, index) => (
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
                                                                onClick={() => removeFlagArrayValue(flag.Name, index)}
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
                                                        value={flagInputValues[flag.Name] || ''}
                                                        onChange={(e) => handleFlagArrayInputChange(flag.Name, e.target.value)}
                                                        onKeyPress={(e) => handleFlagArrayKeyPress(e, flag.Name)}
                                                        style={{
                                                            border: 'none',
                                                            outline: 'none',
                                                            flex: 1,
                                                            minWidth: '150px',
                                                            padding: '0',
                                                            fontSize: '14px',
                                                        }}
                                                        placeholder={`${flag.Description || flag.Name} (press Enter to add)`}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <input
                                            type="text"
                                            id={flag.Name}
                                            value={flagValues[flag.Name] || ''}
                                            onChange={(e) => handleFlagChange(flag.Name, e.target.value)}
                                            className="form-control form-control-sm"
                                            placeholder={flag.Description || `${flag.Name} value`}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        <button
                            className="btn btn-sm btn-primary"
                            type="submit"
                            disabled={loading}
                            style={{ marginTop: '16px' }}
                        >
                            {loading ? 'Running...' : 'Run'}
                        </button>
                    </form>

                    {/* Output */}
                    {output && (
                        <div style={{
                            marginTop: '24px',
                            padding: '16px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                        }}>
                            <strong>Output:</strong>
                            <div style={{ marginTop: '8px' }}>{output}</div>
                        </div>
                    )}

                    {error && (
                        <div style={{
                            marginTop: '24px',
                            padding: '16px',
                            border: '1px solid #ff9999',
                            borderRadius: '4px',
                            color: '#cc0000',
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                        }}>
                            <strong>Error:</strong>
                            <div style={{ marginTop: '8px' }}>{error}</div>
                        </div>
                    )}
                </>
            )}

            <div className="menu-values">
                <p><strong>Menu Input 1:</strong> {menuInput1}</p>
                <p><strong>Menu Input 2:</strong> {menuInput2}</p>
            </div>
        </>
    );
};
