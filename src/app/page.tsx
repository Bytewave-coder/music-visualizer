import dynamic from 'next/dynamic';

const MusicVisualizer = dynamic(() => import('@/components/MusicVisualizer'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-[#050510]">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-[#00f5ff]/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-[#00f5ff]/40 animate-spin" />
          <div className="absolute inset-4 rounded-full border-2 border-[#00f5ff] animate-pulse" />
        </div>
        <div className="text-white/40 text-sm tracking-[0.3em] font-mono uppercase">
          Initializing AURA
        </div>
      </div>
    </div>
  ),
});

export default function Home() {
  return <MusicVisualizer />;
}
