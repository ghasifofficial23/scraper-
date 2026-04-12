"use client";

import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Article } from "./ArticleMarquee";

interface SourceChartProps {
  articles: Article[];
}

export function SourceChart({ articles }: SourceChartProps) {
  const data = useMemo(() => {
    const counts = articles.reduce((acc, article) => {
      const source = article.source || "Unknown";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [articles]);

  // Acid-lime, Neon purple, Deep blue, etc.
  const COLORS = ["#BFF549", "#8B5CF6", "#0EA5E9", "#F43F5E"];

  return (
    <div className="w-full h-full min-h-[300px] flex flex-col justify-center items-center backdrop-blur-md bg-black/30 border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      <h3 className="text-white/80 font-bold text-lg mb-4 tracking-wider uppercase text-center w-full z-10">Data Visualization</h3>
      <div className="w-full h-full flex-1 z-10 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              animationBegin={200}
              animationDuration={1000}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Decorative gradient orb for glassmorphism pop */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#BFF549]/10 rounded-full blur-[50px] pointer-events-none" />
    </div>
  );
}
