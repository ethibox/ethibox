export default ({ columns = [], rows = [] }) => (
    <div className="my-10">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <div className="overflow-hidden shadow-sm outline-1 outline-black/5 sm:rounded-lg">
                    <table className="relative min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                            <tr>
                                {columns.map((column) => (
                                    <th key={column} scope="col" className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                        {column}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {rows.map((row) => (
                                <tr key={row}>
                                    {Object.values(row).map((cell, index) => (
                                        <td key={cell} className={`py-4 pr-3 pl-4 text-sm whitespace-nowrap sm:pl-6 ${index === 0 ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
);
