'use client';

import { useEffect, useRef } from 'react';

interface TickerTapeProps {
  symbols: string[];
}

const TickerTape = ({ symbols }: TickerTapeProps) => {
  const container = useRef<HTMLDivElement | null>(null);
  const prevSymbols = useRef<string>('');

  useEffect(() => {
    if (!container.current) return;
    const normalized = (symbols || [])
      .map((s) => (s || '').trim().toUpperCase())
      .filter((s) => Boolean(s) && s.includes(':'));

    if (normalized.length === 0) {
      container.current.innerHTML = '';
      prevSymbols.current = '';
      return;
    }

    const formattedSymbols = normalized.join(',');

    // If symbols did not change, do nothing (prevents re-initializing the widget repeatedly)
    if (formattedSymbols === prevSymbols.current) return;
    prevSymbols.current = formattedSymbols;

    // Clear previous content
    container.current.innerHTML = '';

    const tickerElement = document.createElement('tv-ticker-tape');
    tickerElement.setAttribute('symbols', formattedSymbols);

    const SCRIPT_ID = 'tv-ticker-tape-script';
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    const mount = () => {
      if (!container.current) return;

      // If an element already exists, update its symbols attribute instead of recreating
      const existing = container.current.querySelector('tv-ticker-tape') as HTMLElement | null;
      if (existing) {
        existing.setAttribute('symbols', formattedSymbols);
        return;
      }

      container.current.innerHTML = '';
      container.current.appendChild(tickerElement);
    };

    const onError = () => {
      if (container.current) container.current.innerHTML = '';
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
    script.addEventListener('error', onError, { once: true });

    return () => {
      // cleanup listeners (guards when script is reused)
      try {
        script?.removeEventListener('load', mount as EventListener);
        script?.removeEventListener('error', onError as EventListener);
      } catch (e) {
        // ignore
      }

      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbols]);

  if ((symbols || []).length === 0) {
    return null;
  }

  return (
    <div ref={container} className="w-full overflow-hidden">
      {/* Ticker tape widget will render here */}
    </div>
  );
};

export default TickerTape;
