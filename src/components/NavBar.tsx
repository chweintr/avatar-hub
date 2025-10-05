export default function NavBar() {
  return (
    <div className="fixed left-4 right-4 top-4 z-[30] flex items-center gap-4 rounded-full border border-white/70 bg-white/50 px-4 py-2 backdrop-blur">
      <div className="flex items-center gap-2 pr-2 border-r border-white/60">
        <span className="inline-block h-3.5 w-3.5 rounded-full bg-gradient-to-br from-white to-pink-300 shadow-[0_0_14px_#f59fb5]" />
        <strong>CALEB'S CLUB</strong>
      </div>
      <a className="rounded-full px-3 py-1 hover:bg-white/60" href="#studio">
        Studio Tools
      </a>
      <a className="rounded-full px-3 py-1 hover:bg-white/60" href="#projection">
        Projection Hub
      </a>
      <a className="rounded-full px-3 py-1 hover:bg-white/60" href="#about">
        About
      </a>
    </div>
  );
}
