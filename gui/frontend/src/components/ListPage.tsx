import React from 'react';
import { main } from '../../wailsjs/go/models';

type Command = main.Command;

interface ListPageProps {
    resultList: Command[];
    onCommandClick: (commandPath: string) => void;
}

export const ListPage: React.FC<ListPageProps> = ({ resultList, onCommandClick }) => {
    return (
        <>
            <p>The List</p>
            <table>
                <thead>
                    <tr>
                        <th>Command</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody id="table-body">
                    {resultList.map((item, index) => (
                        <tr
                            key={index}
                            onClick={() => onCommandClick(item.Path)}
                            className="table-row-clickable"
                        >
                            <td>{item.NameComplete}</td>
                            <td>{item.Description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
};
