import TradingViewWidget from "@/components/TradingViewWidget";
import { AddToWatchlistButton } from "@/components/AddToWatchlistButton";
import {
  SYMBOL_INFO_WIDGET_CONFIG,
  CANDLE_CHART_WIDGET_CONFIG,
  BASELINE_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
  COMPANY_PROFILE_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";
import { isInWatchlist } from "@/lib/actions/watchlist.actions";

interface StockDetailsProps {
  params: Promise<{
    symbol: string;
  }>;
}

export default async function StockDetails({ params }: StockDetailsProps) {
  const { symbol } = await params;
  const baseScriptUrl = "https://s3.tradingview.com/external-embedding/embed-widget-";
  
  // Check if stock is in watchlist
  const inWatchlist = await isInWatchlist(symbol).catch(() => false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      {/* Left Column */}
      <div className="flex flex-col gap-6">
        <TradingViewWidget
          title={null}
          scriptUrl={`${baseScriptUrl}symbol-info.js`}
          config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
        />
        <TradingViewWidget
          title={null}
          scriptUrl={`${baseScriptUrl}advanced-chart.js`}
          config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
          height={600}
        />
        <TradingViewWidget
          title={null}
          scriptUrl={`${baseScriptUrl}advanced-chart.js`}
          config={BASELINE_WIDGET_CONFIG(symbol)}
          height={600}
        />
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <AddToWatchlistButton 
            symbol={symbol} 
            company={symbol}
            initialInWatchlist={inWatchlist}
          />
        </div>
        <TradingViewWidget
          title={null}
          scriptUrl={`${baseScriptUrl}technical-analysis.js`}
          config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
          height={400}
        />
        <TradingViewWidget
          title={null}
          scriptUrl={`${baseScriptUrl}symbol-profile.js`}
          config={COMPANY_PROFILE_WIDGET_CONFIG(symbol)}
          height={440}
        />
        <TradingViewWidget
          title={null}
          scriptUrl={`${baseScriptUrl}financials.js`}
          config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
          height={464}
        />
      </div>
    </div>
  );
}
