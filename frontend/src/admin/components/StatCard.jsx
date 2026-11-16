import clsx from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, trendLabel, colorClass = "bg-[#c9a227]" }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className={clsx("p-2.5 rounded-lg text-white", colorClass)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div className="mb-1">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      
      {trend !== undefined && (
        <div className="flex items-center text-sm">
          {trend > 0 ? (
            <div className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs font-medium">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>+{trend}%</span>
            </div>
          ) : trend < 0 ? (
            <div className="flex items-center text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs font-medium">
              <TrendingDown className="w-3 h-3 mr-1" />
              <span>{trend}%</span>
            </div>
          ) : (
            <div className="text-gray-500 bg-gray-50 px-2 py-0.5 rounded text-xs font-medium">
              0%
            </div>
          )}
          <span className="ml-2 text-gray-500 text-xs">{trendLabel || 'vs last month'}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
