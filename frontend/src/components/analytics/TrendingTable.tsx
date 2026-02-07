import { useState } from "react";
import { ChevronUp, ChevronDown, TrendingUp, TrendingDown, Award, Medal } from "lucide-react";
import { cn } from "../../utils/cn";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TrendingTableProps {
  data: any[];
  columns: Column[];
  className?: string;
}

const TrendingTable = ({ data, columns, className }: TrendingTableProps) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const sortedData = sortKey
    ? [...data].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        const multiplier = sortOrder === "asc" ? 1 : -1;
        return aVal > bVal ? multiplier : -multiplier;
      })
    : data;

  const getRankMedal = (index: number) => {
    if (index === 0) return <Award className="w-5 h-5 text-amber-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="text-gray-600">{index + 1}</span>;
  };

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                    column.sortable && "cursor-pointer hover:bg-gray-100 transition-colors"
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && sortKey === column.key && (
                      <>
                        {sortOrder === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">{getRankMedal(index)}</div>
                </td>
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 whitespace-nowrap text-sm">
                    {column.render ? (
                      column.render(row[column.key], row)
                    ) : column.key === "trend" ? (
                      <div
                        className={cn(
                          "flex items-center gap-1",
                          row[column.key] > 0
                            ? "text-green-600"
                            : row[column.key] < 0
                            ? "text-red-600"
                            : "text-gray-600"
                        )}
                      >
                        {row[column.key] > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : row[column.key] < 0 ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : null}
                        <span>{Math.abs(row[column.key])}%</span>
                      </div>
                    ) : (
                      <span className="text-gray-900">{row[column.key]}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrendingTable;