import { WeeksProfit } from '@/components/Charts/weeks-profit';
import { createTimeFrameExtractor } from '@/utils/timeframe-extractor';
import { Suspense } from 'react';
import { DashboardKpiCards } from './_components/overview-cards';
import { OverviewCardsSkeleton } from './_components/overview-cards/skeleton';
import { SalesOverview } from './_components/sales-overview';
import { DashboardHeader } from './_components/dashboard-header';
import { DashboardWidgets } from './_components/dashboard-widgets';
import { QuickActionsSection } from './_components/quick-actions';
import {
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Package,
  ChefHat,
  Boxes,
  BarChart3,
} from 'lucide-react';
type PropsType = {
  searchParams: Promise<{
    selected_time_frame?: string;
  }>;
};

export default async function Home({ searchParams }: PropsType) {
  const { selected_time_frame } = await searchParams;
  const extractTimeFrame = createTimeFrameExtractor(selected_time_frame);

  return (
    <>
      <DashboardHeader />

      <div className='mt-4'>
        <Suspense fallback={<OverviewCardsSkeleton />}>
          <DashboardKpiCards />
        </Suspense>
      </div>
      <QuickActionsSection
        actions={[
          {
            title: 'New Sale',
            description: 'Record a transaction',
            href: '/sales/new',
            icon: <ShoppingCart className='h-5 w-5' />,
          },
          {
            title: 'Plan Production',
            description: 'Schedule kitchen prep',
            href: '/kitchen',
            icon: <ChefHat className='h-5 w-5' />,
          },
          {
            title: 'Check Inventory',
            description: 'View stock levels',
            href: '/inventory',
            icon: <Package className='h-5 w-5' />,
          },
          {
            title: 'Purchase Requests',
            description: 'Manage supplier orders',
            href: '/kitchen/requests',
            icon: <Boxes className='h-5 w-5' />,
          },
        ]}
      />

      <div className='mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-9 2xl:gap-7.5'>
        <SalesOverview className='col-span-12 xl:col-span-7' />
        <WeeksProfit
          key={extractTimeFrame('weeks_profit')}
          timeFrame={extractTimeFrame('weeks_profit')?.split(':')[1]}
          className='col-span-12 xl:col-span-5'
        />
      </div>

      <DashboardWidgets />
    </>
  );
}
