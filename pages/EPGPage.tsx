
import React from 'react';
import type { Channel, EPGProgram } from '../types';
import { MOCK_EPG_DATA } from '../constants';
import { Play } from 'lucide-react';

interface EPGPageProps {
  channels: Channel[];
  onPlay: (url: string, title: string, epg?: EPGProgram[]) => void;
}

export const EPGPage: React.FC<EPGPageProps> = ({ channels, onPlay }) => {
  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 16 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Program Guide (EPG)</h1>
      <div className="overflow-x-auto scrollbar-hide">
        <div className="min-w-max bg-gray-800 rounded-lg">
          {/* Header */}
          <div className="flex sticky top-0 bg-gray-800 z-10">
            <div className="w-48 flex-shrink-0 p-3 font-bold border-r border-b border-gray-700">Channel</div>
            <div className="flex">
              {timeSlots.map(time => (
                <div key={time} className="w-48 flex-shrink-0 p-3 font-bold border-r border-b border-gray-700 text-center">{time}</div>
              ))}
            </div>
          </div>

          {/* Body */}
          <div>
            {channels.map(channel => {
              const epgData = MOCK_EPG_DATA[channel.id] || [];
              return (
                <div key={channel.id} className="flex border-b border-gray-700">
                  <div className="w-48 flex-shrink-0 p-3 border-r border-gray-700 flex items-center">
                    <img src={channel.logo} alt={channel.name} className="w-10 h-10 object-contain mr-2"/>
                    <span className="font-semibold text-sm line-clamp-2">{channel.name}</span>
                  </div>
                  <div className="flex relative">
                    {epgData.map((program, index) => {
                      const [startH] = program.start.split(':').map(Number);
                      const [endH, endM] = program.end.split(':').map(Number);
                      const durationHours = (endH + endM / 60) - startH;
                      const width = durationHours * 12; // 12rem per hour (w-48)

                      return (
                        <div
                          key={index}
                          className="h-full p-2 bg-gray-700/50 hover:bg-purple-900/50 border-r border-gray-600 transition-colors cursor-pointer"
                          style={{ width: `${width}rem` }}
                          onClick={() => onPlay(channel.url, channel.name, epgData)}
                        >
                          <p className="font-bold text-sm text-white line-clamp-1">{program.title}</p>
                          <p className="text-xs text-gray-300 line-clamp-1">{program.start} - {program.end}</p>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{program.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
