'use client';

import { useEffect, useRef } from 'react';

interface TickerTapeProps {
  symbols: string[];
}

const TickerTape = ({ symbols }: TickerTapeProps) => {
  const container = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!container.current) return;
    const normalized = (symbols || [])
      .map((s) => (s || '').trim().toUpperCase())
      .filter((s) => Boolean(s) && s.includes(':'));

    if (normalized.length === 0) {
      container.current.innerHTML = '';
      return;
    }

    // Clear previous content
    container.current.innerHTML = '';

    const formattedSymbols = normalized.join(',');

    const tickerElement = document.createElement('tv-ticker-tape');
    tickerElement.setAttribute('symbols', formattedSymbols);

    const SCRIPT_ID = 'tv-ticker-tape-script';
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    const mount = () => {
      if (!container.current) return;
      container.current.innerHTML = '';
      container.current.appendChild(tickerElement);
    };

    if (customElements.get('tv-ticker-tape')) {
      mount();
      return;
    }

    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.type = 'module';
      script.src = 'https://widgets.tradingview-widget.com/w/en/tv-ticker-tape.js';
      script.async = true;
      document.head.appendChild(script);
    }

    script.addEventListener('load', mount, { once: true });
    script.addEventListener('error', () => {
      // If the script fails to load, fail silently instead of crashing the page.
      if (container.current) container.current.innerHTML = '';
    }, { once: true });

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbols]);

  if ((symbols || []).length === 0) {
    return null;
  }

  return (
    <div ref={container} className="w-full">
      {/* Ticker tape widget will render here */}
    </div>
  );
};

export default TickerTape;
