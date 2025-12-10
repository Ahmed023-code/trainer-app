"use client";

import { useEffect } from 'react';

export default function MobileConsole() {
  useEffect(() => {
    // Initialize Eruda (mobile console) for development/testing
    // To enable: add ?eruda=true to URL or set localStorage
    const shouldShowConsole =
      typeof window !== 'undefined' &&
      (window.location.search.includes('eruda=true') ||
       localStorage.getItem('eruda') === 'true');

    if (shouldShowConsole) {
      import('eruda').then((eruda) => {
        eruda.default.init();
        console.log('📱 Eruda mobile console enabled!');
        console.log('💡 Tap the console icon at bottom-right to open/close');
      });
    }
  }, []);

  return null;
}
