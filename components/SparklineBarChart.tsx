import React from 'react';

interface DailyPlay {
  date: string;
  plays: number;
}

interface SparklineBarChartProps {
  data: DailyPlay[];
}

export function SparklineBarChart({ data }: SparklineBarChartProps) {
  if (!data || data.length === 0) return null;

  const maxPlays = Math.max(...data.map(d => d.plays), 1); // prevent division by zero

  return (
    <div className="flex h-32 items-end justify-between gap-1 mt-4 p-4 bg-white rounded-lg border border-gray-100 shadow-sm relative pt-8">
      <div className="absolute top-3 left-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Plays Last 14 Days
      </div>
      {data.map((day, i) => {
        const heightPercent = `${(day.plays / maxPlays) * 100}%`;
        return (
          <div key={i} className="flex flex-col items-center justify-end w-full group h-full">
            <div 
              className="w-full bg-blue-100 hover:bg-blue-300 rounded-t transition-all relative group"
              style={{ height: heightPercent, minHeight: day.plays > 0 ? '4px' : '0px' }}
            >
              <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10 transition-opacity">
                {day.plays} plays on {day.date}
              </div>
            </div>
            <div className="h-4 mt-2 text-[10px] text-gray-400 truncate w-full text-center">
              {/* Only show some dates or just first letter of day to avoid clutter */}
              {i % 3 === 0 ? day.date.split(' ')[1] : ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}
