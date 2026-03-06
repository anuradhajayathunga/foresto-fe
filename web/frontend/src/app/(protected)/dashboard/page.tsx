import { Suspense } from "react";
import { createTimeFrameExtractor } from "@/utils/timeframe-extractor";

// Components
import { WeeksProfit } from "@/components/Charts/weeks-profit";
import { DashboardKpiCards } from "./_components/overview-cards";
import { OverviewCardsSkeleton } from "./_components/overview-cards/skeleton";
import { SalesOverview } from "./_components/sales-overview";
import { DashboardHeader } from "./_components/dashboard-header";
import { DashboardDataProvider } from "./_components/dashboard-data-context";
import { AlertsRow, ActivityRow } from "./_components/dashboard-widgets";
import { QuickActionsRow } from "./_components/quick-actions";

type PropsType = {
  searchParams: Promise<{
    selected_time_frame?: string;
  }>;
};

export default async function Home({ searchParams }: PropsType) {
  // In Next.js 15+, searchParams is a Promise
  const { selected_time_frame } = await searchParams;
  const extractTimeFrame = createTimeFrameExtractor(selected_time_frame);

  return (
    <main>
      {/* Full-width Header with Cover Image */}
      <div className="w-full px-8">
        <DashboardHeader
          coverImage=""
          coverImageDark="/images/cover/cover-06.png"
        />
      </div>

      {/* Content Section */}
      <div className="w-full pt-8">
        <div className="mx-auto max-w-[1600px] space-y-8 px-6 md:px-8">
          <section>
            <Suspense fallback={<OverviewCardsSkeleton />}>
              <DashboardKpiCards />
            </Suspense>
          </section>

          <DashboardDataProvider>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 xl:gap-8 items-start">
              <div className="lg:col-span-8 flex flex-col gap-4 xl:gap-8">
                {/* <AlertsRow /> */}
                <QuickActionsRow />
                <SalesOverview />
              </div>

              <div className="lg:col-span-4 flex flex-col gap-6 xl:gap-8">
                <ActivityRow />
                <WeeksProfit
                  key={extractTimeFrame("weeks_profit")}
                  timeFrame={extractTimeFrame("weeks_profit")?.split(":")[1]}
                />
              </div>
            </div>
          </DashboardDataProvider>
        </div>
      </div>
    </main>
  );
}
