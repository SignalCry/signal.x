import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Indicators",
  description:
    "Technical indicators for top crypto pairs — EMA, RSI, MACD, and Bollinger Bands. Non-technical sentiment metrics coming soon.",
  openGraph: {
    title: "Indicators | SignalX",
    description:
      "Live technical indicators for top crypto pairs. EMA, RSI, MACD, Bollinger Bands.",
  },
};

export default function IndicatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
