import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  TooltipProps,
} from "recharts";

interface PieChartProps {
  data: any[];
  dataKey: string;
  nameKey: string;
  colors?: string[];
  height?: number;
}

const DEFAULT_COLORS = [
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#84cc16",
  "#8b5cf6",
  "#ec4899",
];

const PieChartComponent = ({
  data,
  dataKey,
  nameKey,
  colors = DEFAULT_COLORS,
  height = 300,
}: PieChartProps) => {
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900">{payload[0].name}</p>
          <p className="text-lg font-semibold text-gray-900">
            {payload[0].value?.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          fill="#8884d8"
          dataKey={dataKey}
          nameKey={nameKey}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || colors[index % colors.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: "14px" }}
          layout="vertical"
          align="right"
          verticalAlign="middle"
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};

export default PieChartComponent;
