'use client';

import { useEffect, useRef } from 'react';

interface TickerTapeProps {
  symbols: string[];
}

const TickerTape = ({ symbols }: TickerTapeProps) => {
  const container = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!container.current) return;
    if (symbols.length === 0) return;

    // Clear previous content
    container.current.innerHTML = '';

    // Format symbols for TradingView (add NASDAQ: prefix if no prefix exists)
    const formattedSymbols = symbols
      .map((symbol) => {
        // Add common exchange prefixes based on symbol patterns
        if (symbol.includes(':')) {
          return symbol; // Already has prefix
        }
        // Default to NASDAQ for most stocks
        return `NASDAQ:${symbol}`;
      })
      .join(',');

    // Create the ticker tape script
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://widgets.tradingview-widget.com/w/en/tv-ticker-tape.js';
    script.async = true;

    // Create the ticker tape element
    const tickerElement = document.createElement('tv-ticker-tape');
    tickerElement.setAttribute('symbols', formattedSymbols);

    container.current.appendChild(tickerElement);
    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbols]);

  if (symbols.length === 0) {
    return null;
  }

  return (
    <div ref={container} className="w-full">
      {/* Ticker tape widget will render here */}
    </div>
  );
};

export default TickerTape;
