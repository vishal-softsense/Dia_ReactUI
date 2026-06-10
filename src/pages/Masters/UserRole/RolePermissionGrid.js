import React, { useState, useEffect } from 'react';
import { Table, Input } from 'reactstrap';

const RolePermissionGrid = ({ permissions, onChange }) => {
    const [gridData, setGridData] = useState([]);

    useEffect(() => {
        if (permissions) {
            setGridData(permissions);
        }
    }, [permissions]);

    const handleCellChange = (index, field, checked) => {
        const newData = [...gridData];
        newData[index][field] = checked;

        // If any cell in the row becomes unchecked, 'all' should be false
        if (!checked && field !== 'all') {
            newData[index].all = false;
        }

        // If all cells in the row become checked, 'all' should be true
        if (
            newData[index].select &&
            newData[index].write &&
            newData[index].edit &&
            newData[index].delete &&
            newData[index].navigate
        ) {
            newData[index].all = true;
        }

        setGridData(newData);
        if (onChange) onChange(newData);
    };

    const handleRowAllChange = (index, checked) => {
        const newData = [...gridData];
        newData[index] = {
            ...newData[index],
            all: checked,
            select: checked,
            write: checked,
            edit: checked,
            delete: checked,
            navigate: checked
        };
        setGridData(newData);
        if (onChange) onChange(newData);
    };

    const handleColumnAllChange = (field, checked) => {
        const newData = gridData.map((row) => {
            const updatedRow = { ...row, [field]: checked };
            // Recalculate row 'all' state
            if (
                updatedRow.select &&
                updatedRow.write &&
                updatedRow.edit &&
                updatedRow.delete &&
                updatedRow.navigate
            ) {
                updatedRow.all = true;
            } else {
                updatedRow.all = false;
            }
            return updatedRow;
        });
        setGridData(newData);
        if (onChange) onChange(newData);
    };

    const isColumnAllChecked = (field) => {
        if (gridData.length === 0) return false;
        return gridData.every((row) => row[field]);
    };

    return (
        <div className="table-responsive">
            <Table className="table-bordered table-striped table-hover align-middle mb-0">
                <thead className="table-light">
                    <tr>
                        <th style={{ width: '30%' }}>Form Name</th>
                        <th className="text-center">
                            All<br />
                            <Input
                                type="checkbox"
                                checked={isColumnAllChecked('all')}
                                onChange={(e) => handleColumnAllChange('all', e.target.checked)}
                            />
                        </th>
                        <th className="text-center">
                            Select<br />
                            <Input
                                type="checkbox"
                                checked={isColumnAllChecked('select')}
                                onChange={(e) => handleColumnAllChange('select', e.target.checked)}
                            />
                        </th>
                        <th className="text-center">
                            Insert<br />
                            <Input
                                type="checkbox"
                                checked={isColumnAllChecked('write')}
                                onChange={(e) => handleColumnAllChange('write', e.target.checked)}
                            />
                        </th>
                        <th className="text-center">
                            Edit<br />
                            <Input
                                type="checkbox"
                                checked={isColumnAllChecked('edit')}
                                onChange={(e) => handleColumnAllChange('edit', e.target.checked)}
                            />
                        </th>
                        <th className="text-center">
                            Delete<br />
                            <Input
                                type="checkbox"
                                checked={isColumnAllChecked('delete')}
                                onChange={(e) => handleColumnAllChange('delete', e.target.checked)}
                            />
                        </th>
                        <th className="text-center">
                            Navigate<br />
                            <Input
                                type="checkbox"
                                checked={isColumnAllChecked('navigate')}
                                onChange={(e) => handleColumnAllChange('navigate', e.target.checked)}
                            />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {gridData.map((row, index) => (
                        <tr key={row.formID || index}>
                            <td>{row.formName}</td>
                            <td className="text-center">
                                <Input
                                    type="checkbox"
                                    checked={row.all || false}
                                    onChange={(e) => handleRowAllChange(index, e.target.checked)}
                                />
                            </td>
                            <td className="text-center">
                                <Input
                                    type="checkbox"
                                    checked={row.select || false}
                                    onChange={(e) => handleCellChange(index, 'select', e.target.checked)}
                                />
                            </td>
                            <td className="text-center">
                                <Input
                                    type="checkbox"
                                    checked={row.write || false}
                                    onChange={(e) => handleCellChange(index, 'write', e.target.checked)}
                                />
                            </td>
                            <td className="text-center">
                                <Input
                                    type="checkbox"
                                    checked={row.edit || false}
                                    onChange={(e) => handleCellChange(index, 'edit', e.target.checked)}
                                />
                            </td>
                            <td className="text-center">
                                <Input
                                    type="checkbox"
                                    checked={row.delete || false}
                                    onChange={(e) => handleCellChange(index, 'delete', e.target.checked)}
                                />
                            </td>
                            <td className="text-center">
                                <Input
                                    type="checkbox"
                                    checked={row.navigate || false}
                                    onChange={(e) => handleCellChange(index, 'navigate', e.target.checked)}
                                />
                            </td>
                        </tr>
                    ))}
                    {gridData.length === 0 && (
                        <tr>
                            <td colSpan="7" className="text-center py-4">No permissions data available</td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </div>
    );
};

export default RolePermissionGrid;
