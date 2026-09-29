import { useState, useEffect } from 'react';
import './App.css';
import { List, Command as GetCommand } from "../wailsjs/go/main/App";
import { main } from "../wailsjs/go/models";
import { MenuPanel } from './components/MenuPanel';
import { ListPage } from './components/ListPage';
import { DetailPage } from './components/DetailPage';

type Command = main.Command;
type CommandComplete = main.CommandComplete;

function App() {
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [resultList, setResultList] = useState<Command[]>([]);
    const [selectedCommand, setSelectedCommand] = useState<CommandComplete | null>(null);
    const [menuInput1, setMenuInput1] = useState('');
    const [menuInput2, setMenuInput2] = useState('');

    const updateResultList = (result: Command[]) => setResultList(result);

    useEffect(() => {
        List().then(updateResultList);
    }, []);

    const handleCommandClick = (commandPath: string) => {
        GetCommand(commandPath).then((cmd) => {
            setSelectedCommand(cmd);
            setView('detail');
        });
    };

    const handleBackToList = () => {
        setView('list');
        setSelectedCommand(null);
    };

    return (
        <div className="app-container">
            <MenuPanel
                menuInput1={menuInput1}
                setMenuInput1={setMenuInput1}
                menuInput2={menuInput2}
                setMenuInput2={setMenuInput2}
            />

            <main className="main-content">
                {view === 'list' ? (
                    <ListPage
                        resultList={resultList}
                        onCommandClick={handleCommandClick}
                    />
                ) : (
                    <DetailPage
                        cmd={selectedCommand}
                        menuInput1={menuInput1}
                        menuInput2={menuInput2}
                        onBack={handleBackToList}
                        onCommandClick={handleCommandClick}
                    />
                )}
            </main>
        </div>
    )
}

export default App
