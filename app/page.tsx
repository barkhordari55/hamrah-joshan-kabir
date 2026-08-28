'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
  }, []);

  return (
    <main className="h-dvh w-full overflow-hidden bg-[#eaf7f4]">
      <iframe title="همراه جوشن کبیر" src="/joshan/index.html" className="h-full w-full border-0" allow="notifications" />
    </main>
  );
}
