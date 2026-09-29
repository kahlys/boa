import React from 'react';

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
            </form>
        </aside>
    );
};
