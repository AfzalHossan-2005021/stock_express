'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import useTradingViewWidget from '@/hooks/useTradingViewWidget';

interface TradingViewWidgetProps {
  title: string | null;
  scriptUrl: string;
  config: Record<string, unknown>;
  height?: number;
  className?: string;
}

const TradingViewWidget = ({ title = null, scriptUrl, config, height = 600, className }: TradingViewWidgetProps) => {
  const container = useTradingViewWidget(scriptUrl, config, height);

  return (
    <div className="w-full">
      {title && <h2 className="font-semibold text-2xl text-gray-100 mb-4">{title}</h2>}
      <div className={cn('tradingview-widget-container', className)} ref={container}>
        <div className="tradingview-widget-container__widget" style={{ height, width: "100%" }} />
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);
