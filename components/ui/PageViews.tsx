
import React from 'react';

export const HomeView: React.FC = () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-white p-8">
        <h1 className="text-6xl font-black mb-4">HOME</h1>
        <p className="text-slate-400 uppercase tracking-[0.3em]">Welcome back, Commander</p>
    </div>
);

export const UnitsView: React.FC = () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-white p-8">
        <h1 className="text-6xl font-black mb-4">UNITS</h1>
        <p className="text-slate-400 uppercase tracking-[0.3em]">Manage your roster</p>
    </div>
);

export const MissionView: React.FC = () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-white p-8">
        <h1 className="text-6xl font-black mb-4">MISSION</h1>
        <p className="text-slate-400 uppercase tracking-[0.3em]">Deploy to the field</p>
    </div>
);

export const MusicView: React.FC = () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-white p-8">
        <h1 className="text-6xl font-black mb-4">MUSIC</h1>
        <p className="text-slate-400 uppercase tracking-[0.3em]">Soundtrack selection</p>
    </div>
);
