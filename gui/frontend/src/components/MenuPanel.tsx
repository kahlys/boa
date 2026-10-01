import React, { useState } from 'react';
import { OpenFile, OpenDirectory } from '../../wailsjs/go/main/App';

interface MenuPanelProps {
    menuInput1: string;
    setMenuInput1: (value: string) => void;
    menuInput2: string;
    setMenuInput2: (value: string) => void;
}

export const MenuPanel: React.FC<MenuPanelProps> = ({
    menuInput1,
    setMenuInput1,
    menuInput2,
    setMenuInput2,
}) => {
    const [filePath, setFilePath] = useState<string>('');

    const handleFilePickerClick = async () => {
        try {
            const path = await OpenFile();
            if (path) {
                setFilePath(path);
            }
        } catch (err) {
            // Handle error silently
        }
    };

    const handleDirectoryPickerClick = async () => {
        try {
            const path = await OpenDirectory();
            if (path) {
                setFilePath(path);
            }
        } catch (err) {
            // Handle error silently
        }
    };

    return (
        <aside className="menu-panel">
            <h3>Menu</h3>
            <form>
                <div className="form-group">
                    <label>Input 1</label>
                    <input
                        type="text"
                        value={menuInput1}
                        onChange={(e) => setMenuInput1(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>Input 2</label>
                    <input
                        type="text"
                        value={menuInput2}
                        onChange={(e) => setMenuInput2(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>Path</label>
                    <input
                        type="text"
                        value={filePath}
                        readOnly
                        placeholder="No path selected"
                        className="path-input"
                    />
                    <div className="button-group">
                        <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={handleFilePickerClick}
                        >
                            Browse File
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={handleDirectoryPickerClick}
                        >
                            Browse Directory
                        </button>
                    </div>
                </div>
            </form>
        </aside>
    );
};
