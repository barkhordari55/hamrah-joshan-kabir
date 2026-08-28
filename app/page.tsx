'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    window.location.replace('/joshan/index.html');
  }, []);

  return (
    <main className="grid h-dvh place-items-center bg-[#eaf7f4] px-6 text-center text-[#075e5b]" dir="rtl">
      <div>
        <p className="text-lg">در حال باز کردن همراه جوشن کبیر…</p>
        <a className="mt-4 inline-block underline" href="/joshan/index.html">اگر برنامه باز نشد، اینجا بزنید</a>
      </div>
    </main>
  );
}
