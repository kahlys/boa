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
    const [argsInputs, setArgsInputs] = useState<string[]>(['']);
    const [flagValues, setFlagValues] = useState<Record<string, any>>({});
    const [output, setOutput] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);

    // Initialize flag values when command changes
    useEffect(() => {
        console.log('DetailPage: cmd changed', cmd);
        const flags = cmd?.Flags || [];
        const initialized: Record<string, any> = {};
        flags.forEach((flag) => {
            if (flag.Type === 'bool') {
                initialized[flag.Name] = false;
            } else if (flag.Type === 'array') {
                initialized[flag.Name] = [''];
            } else {
                initialized[flag.Name] = '';
            }
        });
        console.log('DetailPage: initialized flags', initialized);
        setFlagValues(initialized);
        // Reset args and output when changing commands
        setArgsInputs(['']);
        setOutput('');
        setError('');
    }, [cmd]);

    const addArgsInput = () => {
        setArgsInputs([...argsInputs, '']);
    };

    const handleArgsChange = (index: number, value: string) => {
        const updated = [...argsInputs];
        updated[index] = value;
        setArgsInputs(updated);
    };

    const handleFlagChange = (flagName: string, value: any) => {
        setFlagValues((prev) => ({
            ...prev,
            [flagName]: value,
        }));
    };

    const addFlagArrayInput = (flagName: string) => {
        setFlagValues((prev) => ({
            ...prev,
            [flagName]: [...(prev[flagName] as string[]), ''],
        }));
    };

    const handleFlagArrayChange = (flagName: string, index: number, value: string) => {
        setFlagValues((prev) => {
            const updated = [...(prev[flagName] as string[])];
            updated[index] = value;
            return { ...prev, [flagName]: updated };
        });
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

            // Filter out empty positional arguments
            const args = argsInputs.filter((arg) => arg.trim());

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

            <h1>{cmd?.Name}</h1>
            <p>{cmd?.Short}</p>

            {(cmd?.SubCommands || []).map((subCmd, index) => (
                <button
                    key={index}
                    onClick={() => onCommandClick(subCmd.Path)}
                    className="back-button"
                    style={{ cursor: 'pointer' }}
                >
                    {subCmd.Name}
                </button>
            ))}
            <button onClick={onBack} className="back-button" style={{ cursor: 'pointer' }}>all</button>

            {cmd?.IsRunnable && (
                <>
                    <form onSubmit={handleSubmit}>
                        {/* Positional arguments */}
                        <div id="args-container" style={{ marginBottom: '16px' }}>
                            {argsInputs.map((value, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    value={value}
                                    onChange={(e) => handleArgsChange(index, e.target.value)}
                                    className="form-control form-control-sm"
                                    placeholder="positional argument"
                                    style={{ marginBottom: '8px' }}
                                />
                            ))}
                        </div>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={addArgsInput}
                            style={{ marginBottom: '16px' }}
                        >
                            add argument
                        </button>

                        {/* Flags */}
                        {(cmd?.Flags || []).map((flag: Flag) => (
                            <div key={flag.Name} style={{ marginTop: '16px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #eee' }}>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
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
                                            <label htmlFor={`${flag.Name}-on`} style={{ marginLeft: '4px' }}>
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
                                            <label htmlFor={`${flag.Name}-off`} style={{ marginLeft: '4px' }}>
                                                off
                                            </label>
                                        </div>
                                    </div>
                                ) : flag.Type === 'array' ? (
                                    <>
                                        <div id={`flag-${flag.Name}-container`}>
                                            {((flagValues[flag.Name] || []) as string[]).map((value, index) => (
                                                <input
                                                    key={index}
                                                    type="text"
                                                    value={value}
                                                    onChange={(e) => handleFlagArrayChange(flag.Name, index, e.target.value)}
                                                    className="form-control form-control-sm"
                                                    placeholder={flag.Description || `${flag.Name} value`}
                                                    style={{ marginBottom: '8px' }}
                                                />
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={() => addFlagArrayInput(flag.Name)}
                                        >
                                            add {flag.Name}
                                        </button>
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
