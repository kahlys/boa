import React, { useState, useEffect } from 'react';
import { main } from '../../wailsjs/go/models';
import { ExecuteWithInput } from '../../wailsjs/go/main/App';
import { ArrayInput } from './ArrayInput';
import { BooleanSwitch } from './BooleanSwitch';

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
            <div className="debug-box">
                <strong>Debug Info:</strong>
                <div>cmd.Name: {cmd?.Name || 'NULL'}</div>
                <div>cmd.Path: {cmd?.Path || 'NULL'}</div>
                <div>cmd.IsRunnable: {cmd?.IsRunnable === undefined ? 'UNDEFINED' : String(cmd?.IsRunnable)}</div>
                <div>cmd.Flags count: {cmd?.Flags?.length || 0}</div>
                <div>cmd.SubCommands count: {cmd?.SubCommands?.length || 0}</div>
                {cmd?.Short && <div>cmd.Short: {cmd.Short}</div>}
            </div>

            <div className="page-header">
                <h3>{cmd?.Name}</h3>
                <p>{cmd?.Short}</p>
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
                <div>
                    <form onSubmit={handleSubmit}>
                        {/* Positional arguments */}
                        {/* {cmd?.Args !== '' && ( */}
                            <div className="card-box">
                                <div>
                                    <label htmlFor="args-container" className="label-primary">Args</label>
                                </div>
                                <div id="args-container">
                                    <ArrayInput
                                        values={argsValues}
                                        inputValue={argsInputValue}
                                        onInputChange={handleArgsInputChange}
                                        onKeyPress={handleArgsKeyPress}
                                        onRemove={removeArg}
                                        placeholder="positional argument (press Enter to add)"
                                    />
                                </div>
                            </div>
                        {/* )} */}

                        {/* Flags */}
                        <div className="card-box">
                            <label className="label-primary">
                                Flags
                            </label>
                            {(cmd?.Flags || []).map((flag: Flag) => (
                                <div key={flag.Name} className="form-item">
                                    <label className="label-secondary">
                                        {flag.Name}
                                    </label>

                                    {flag.Type === 'bool' ? (
                                        <BooleanSwitch
                                            value={flagValues[flag.Name] === true}
                                            onChange={(value) => handleFlagChange(flag.Name, value)}
                                        />
                                    ) : flag.Type === 'array' ? (
                                        <div id={`flag-${flag.Name}-container`}>
                                            <ArrayInput
                                                values={(flagValues[flag.Name] || []) as string[]}
                                                inputValue={flagInputValues[flag.Name] || ''}
                                                onInputChange={(value) => handleFlagArrayInputChange(flag.Name, value)}
                                                onKeyPress={(e) => handleFlagArrayKeyPress(e, flag.Name)}
                                                onRemove={(index) => removeFlagArrayValue(flag.Name, index)}
                                                placeholder={`${flag.Description || flag.Name} (press Enter to add)`}
                                            />
                                        </div>
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
                            className="btn btn-sm btn-primary btn-submit"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Running...' : 'Run'}
                        </button>
                    </form>

                    {/* Output */}
                    {output && (
                        <div className="output-box">
                            <strong>Output:</strong>
                            <div style={{ marginTop: '8px' }}>{output}</div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="error-box">
                            <strong>Error:</strong>
                            <div style={{ marginTop: '8px' }}>{error}</div>
                        </div>
                    )}
                </div>
            )}

            <div className="menu-values">
                <p><strong>Menu Input 1:</strong> {menuInput1}</p>
                <p><strong>Menu Input 2:</strong> {menuInput2}</p>
            </div>
        </>
    );
};
