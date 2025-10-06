let simliClientSingleton: any | null = null;

export async function getSimliClient() {
  if (simliClientSingleton) return simliClientSingleton;

  // Wait for UMD global
  const SimliGlobal: any = await new Promise((resolve, reject) => {
    const t0 = Date.now();
    (function poll() {
      const g: any = (window as any);
      const mod = g.SimliClient || g.Simli || g.default;
      if (mod) return resolve(mod.SimliClient || mod.default || mod);
      if (Date.now() - t0 > 6000) return reject(new Error("Simli UMD not found"));
      requestAnimationFrame(poll);
    })();
  });

  const Ctor = typeof SimliGlobal === "function" ? SimliGlobal : (SimliGlobal?.default ?? SimliGlobal);
  if (typeof Ctor !== "function") throw new Error("Bad SimliClient export");

  simliClientSingleton = new Ctor();
  return simliClientSingleton;
}

export function resetSimliClient() {
  try { simliClientSingleton?.stop?.(); } catch {}
  simliClientSingleton = null;
}
