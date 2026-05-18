import React from 'react';
import { Infinity, Layers, Hexagon, Command, Sparkles } from 'lucide-react';

export default function LogoGallery({ onSelect }) {
    return (
        <div className="glass-panel p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-violet-500" />
                        Select Your Omnia Logo
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1">These are native UI components built with Lucide icons and our theme gradients. Pick your favorite!</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Option 1: Infinity */}
                <div className="bg-white/50 border border-white p-6 rounded-2xl flex flex-col items-center justify-center gap-4 hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1"
                     onClick={() => onSelect('infinity')}>
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                        <Infinity className="text-white w-7 h-7" />
                    </div>
                    <div className="text-center">
                        <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-700 to-fuchsia-700 text-xl tracking-tight">OMNIA</h1>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Admin</p>
                    </div>
                    <div className="mt-2 text-xs font-medium text-violet-600 bg-violet-50 px-3 py-1 rounded-full border border-violet-100">Option 1: Infinity</div>
                </div>

                {/* Option 2: Layers */}
                <div className="bg-zinc-800 border border-zinc-700 p-6 rounded-2xl flex flex-col items-center justify-center gap-4 hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1"
                     onClick={() => onSelect('layers')}>
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                        <Layers className="text-violet-400 w-7 h-7" />
                    </div>
                    <div className="text-center">
                        <h1 className="font-bold text-white text-xl tracking-wide">Omnia.</h1>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-0.5">Education</p>
                    </div>
                    <div className="mt-2 text-xs font-medium text-zinc-400 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-700">Option 2: Layers (Dark)</div>
                </div>

                {/* Option 3: Hexagon */}
                <div className="bg-white/50 border border-white p-6 rounded-2xl flex flex-col items-center justify-center gap-4 hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1"
                     onClick={() => onSelect('hexagon')}>
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 text-indigo-600 shadow-inner">
                        <Hexagon className="w-7 h-7" />
                    </div>
                    <div className="text-center">
                        <h1 className="font-black text-zinc-800 text-xl tracking-tighter">omnia</h1>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Manager</p>
                    </div>
                    <div className="mt-2 text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Option 3: Hexagon</div>
                </div>

                {/* Option 4: Command */}
                <div className="bg-white/50 border border-white p-6 rounded-2xl flex flex-col items-center justify-center gap-4 hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1"
                     onClick={() => onSelect('command')}>
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-fuchsia-100 rounded-full flex items-center justify-center text-fuchsia-600">
                            <Command className="w-6 h-6" />
                        </div>
                        <h1 className="font-bold text-zinc-900 text-2xl tracking-tight">OMNIA</h1>
                    </div>
                    <div className="mt-4 text-xs font-medium text-fuchsia-600 bg-fuchsia-50 px-3 py-1 rounded-full border border-fuchsia-100">Option 4: Command</div>
                </div>

            </div>
        </div>
    )
}
