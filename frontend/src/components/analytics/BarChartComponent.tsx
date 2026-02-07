import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  TooltipProps,
} from "recharts";

interface BarChartProps {
  data: any[];
  dataKeys: { key: string; color: string; name?: string }[];
  xKey: string;
  height?: number;
}

const BarChartComponent = ({
  data,
  dataKeys,
  xKey,
  height = 300,
}: BarChartProps) => {
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {payload[0].payload[xKey]}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-gray-600">
              <span style={{ color: entry.color }}>{entry.name}: </span>
              <span className="font-semibold">{entry.value?.toLocaleString()}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey={xKey} stroke="#6b7280" style={{ fontSize: "12px" }} />
        <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        {dataKeys.map((dk) => (
          <Bar
            key={dk.key}
            dataKey={dk.key}
            fill={dk.color}
            name={dk.name || dk.key}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default BarChartComponent;