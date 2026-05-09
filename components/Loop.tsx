import React from 'react';
import { SettlementInputController } from '../game/settlement/SettlementInputController';
import { SettlementManager } from '../game/settlement/SettlementManager';
import { SettlementRenderer } from '../game/settlement/SettlementRenderer';
import type { SettlementSnapshot, SettlementTool } from '../game/settlement/SettlementTypes';

interface LoopProps {
  onReady?: () => void;
}

const tools: Array<{ id: SettlementTool; label: string }> = [
  { id: 'stockpile', label: 'Stockpile' },
  { id: 'floor', label: 'Floor' },
  { id: 'wall', label: 'Wall' },
  { id: 'chop', label: 'Chop' },
  { id: 'mine', label: 'Mine' },
];

const Loop: React.FC<LoopProps> = ({ onReady }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const managerRef = React.useRef<SettlementManager | null>(null);
  const rendererRef = React.useRef<SettlementRenderer | null>(null);
  const inputRef = React.useRef<SettlementInputController | null>(null);
  const frameRef = React.useRef<number>(0);
  const lastTimeRef = React.useRef<number>(0);
  const [snapshot, setSnapshot] = React.useState<SettlementSnapshot | null>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const manager = new SettlementManager();
    const renderer = new SettlementRenderer(container);
    const input = new SettlementInputController(renderer, manager);
    managerRef.current = manager;
    rendererRef.current = renderer;
    inputRef.current = input;

    const unsubscribe = manager.subscribe((nextSnapshot) => {
      setSnapshot({ ...nextSnapshot, state: { ...nextSnapshot.state } });
      renderer.sync(nextSnapshot.state);
    });

    const onResize = () => renderer.resize();
    window.addEventListener('resize', onResize);

    const animate = (time: number) => {
      const lastTime = lastTimeRef.current || time;
      lastTimeRef.current = time;
      const dt = Math.min(0.08, Math.max(0, (time - lastTime) / 1000));
      manager.tick(dt);
      renderer.render();
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    onReady?.();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', onResize);
      unsubscribe();
      input.dispose();
      renderer.dispose();
      managerRef.current = null;
      rendererRef.current = null;
      inputRef.current = null;
    };
  }, [onReady]);

  const state = snapshot?.state;
  const debug = snapshot?.debug;

  const setTool = (tool: SettlementTool) => managerRef.current?.setTool(tool);
  const setSpeed = (speed: number) => managerRef.current?.setSpeed(speed);

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950">
      <div ref={containerRef} className="absolute inset-0" onContextMenu={(event) => event.preventDefault()} />

      {state && debug && (
        <div className="no-capture pointer-events-none absolute inset-0 z-[80] text-white">
          <div className="pointer-events-auto absolute left-4 top-4 w-[320px] rounded-lg border border-white/10 bg-black/70 p-3 shadow-2xl backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">Settlement Loop</div>
                <div className="text-sm font-bold text-white/90">Post-collapse colony test</div>
              </div>
              <div className="text-right text-[10px] uppercase tracking-widest text-white/50">Day {Math.max(1, Math.floor(state.elapsed / 120) + 1)}</div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <ResourceBox label="Wood" value={state.resources.wood} />
              <ResourceBox label="Stone" value={state.resources.stone} />
              <ResourceBox label="Food" value={state.resources.food} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setTool(tool.id)}
                  className={`rounded-md border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
                    state.selectedTool === tool.id
                      ? 'border-cyan-300 bg-cyan-400/20 text-cyan-100'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {tool.label}
                </button>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              {[0, 1, 2].map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => setSpeed(speed)}
                  className={`flex-1 rounded-md border px-2 py-2 text-[10px] font-black uppercase tracking-widest ${
                    state.speed === speed
                      ? 'border-emerald-300 bg-emerald-400/20 text-emerald-100'
                      : 'border-white/10 bg-white/5 text-white/70'
                  }`}
                >
                  {speed === 0 ? 'Pause' : `${speed}x`}
                </button>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => managerRef.current?.save()} className="flex-1 rounded-md bg-white/10 px-2 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/15">Save</button>
              <button type="button" onClick={() => managerRef.current?.load()} className="flex-1 rounded-md bg-white/10 px-2 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/15">Load</button>
              <button type="button" onClick={() => managerRef.current?.reset()} className="flex-1 rounded-md bg-red-500/20 px-2 py-2 text-[10px] font-black uppercase tracking-widest text-red-100 hover:bg-red-500/30">Reset</button>
            </div>
          </div>

          <div className="pointer-events-auto absolute right-4 top-4 w-[340px] rounded-lg border border-white/10 bg-black/70 p-3 shadow-2xl backdrop-blur-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-300">Settlers</div>
            <div className="mt-2 space-y-2">
              {state.settlers.map((settler) => (
                <div key={settler.id} className="rounded-md border border-white/10 bg-white/[0.04] p-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-bold">{settler.name}</div>
                    <div className="text-[10px] uppercase tracking-widest text-white/50">{settler.role}</div>
                  </div>
                  <div className="mt-1 text-[11px] text-white/70">{settler.status}</div>
                  <div className="mt-1 text-[10px] text-white/45">
                    HP {settler.health} · {settler.carrying ? `Carrying ${settler.carrying.amount} ${settler.carrying.type}` : 'Empty hands'}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-md border border-cyan-400/20 bg-cyan-400/10 p-2 text-[10px] uppercase tracking-widest text-cyan-100">
              <div>Jobs: {debug.totalJobs}</div>
              <div>Reserved: {debug.reservedJobs} · Active: {debug.activeJobs} · Blocked: {debug.blockedJobs}</div>
              <div>Idle settlers: {debug.idleSettlers}</div>
              <div>Selected: {debug.selectedTool}</div>
            </div>
          </div>

          <div className="pointer-events-auto absolute bottom-4 left-4 max-h-64 w-[520px] overflow-hidden rounded-lg border border-white/10 bg-black/70 p-3 shadow-2xl backdrop-blur-sm">
            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/60">Event Log</div>
            <div className="space-y-1 overflow-hidden text-xs text-white/75">
              {state.logs.slice(0, 10).map((log) => (
                <div key={log.id} className="truncate">
                  <span className="mr-2 text-white/35">[{log.time}s]</span>{log.text}
                </div>
              ))}
            </div>
          </div>

          <div className="absolute bottom-4 right-4 rounded-md border border-white/10 bg-black/55 px-3 py-2 text-[10px] uppercase tracking-widest text-white/45 backdrop-blur-sm">
            Left click grid cells with a selected tool. Right drag rotates. Wheel zooms.
          </div>
        </div>
      )}
    </div>
  );
};

const ResourceBox: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-2">
    <div className="text-[10px] uppercase tracking-widest text-white/45">{label}</div>
    <div className="text-lg font-black">{value}</div>
  </div>
);

export default Loop;
