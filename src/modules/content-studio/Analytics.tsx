// import React from 'react';
import { TrendingUp, Users, DollarSign, Eye, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
  { name: 'Total Views', value: '1.2M', change: '+12.5%', trend: 'up', icon: Eye },
  { name: 'Subscribers', value: '45.2K', change: '+5.2%', trend: 'up', icon: Users },
  { name: 'Est. Revenue', value: '$2,450', change: '+18.3%', trend: 'up', icon: DollarSign },
  { name: 'Engagement', value: '8.4%', change: '-2.1%', trend: 'down', icon: TrendingUp },
];

const Analytics = () => {
  return (
    <div className="h-full flex flex-col space-y-6 overflow-y-auto no-scrollbar pb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="glass-panel rounded-2xl p-5 border-jarvis-blue/10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg bg-jarvis-blue/10">
                <stat.icon className="w-5 h-5 text-jarvis-blue" />
              </div>
              <div className={`flex items-center space-x-1 text-[10px] font-bold ${
                stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
              }`}>
                <span>{stat.change}</span>
                {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              </div>
            </div>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{stat.name}</p>
            <p className="text-2xl font-black mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass-panel rounded-2xl p-6 border-jarvis-blue/20">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest">Growth Performance</h3>
            <div className="flex space-x-2">
              {['7D', '30D', '90D', 'ALL'].map(t => (
                <button key={t} className={`px-2 py-1 rounded text-[8px] font-bold ${t === '30D' ? 'bg-jarvis-blue text-black' : 'hover:bg-white/5 text-white/40'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="h-48 flex items-end justify-between space-x-2">
            {[40, 60, 45, 70, 85, 55, 90, 75, 65, 80, 95, 100].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 1, delay: i * 0.05 }}
                className="w-full bg-jarvis-blue/20 border-t border-jarvis-blue/50 rounded-t-sm hover:bg-jarvis-blue/40 transition-colors cursor-pointer relative group"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-jarvis-blue text-black text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {h * 120}
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[8px] font-mono text-white/20">
            <span>JUN 01</span>
            <span>JUN 15</span>
            <span>JUN 30</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 border-jarvis-blue/10">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Top Performing</h3>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3 group cursor-pointer">
                <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/5 overflow-hidden flex-shrink-0">
                   <div className="w-full h-full bg-gradient-to-br from-jarvis-blue/20 to-transparent flex items-center justify-center">
                     <Eye className="w-4 h-4 text-white/20" />
                   </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold truncate group-hover:text-jarvis-blue transition-colors">AI Secret Revealed #{i}</p>
                  <p className="text-[8px] text-white/40 mt-0.5">245.2K views • 98% like ratio</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 border border-white/10 rounded-lg text-[10px] font-bold text-white/40 hover:bg-white/5 transition-all uppercase tracking-widest">
            View All Content
          </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
