import { listSales } from '@/lib/sales';
import { listProductions } from '@/lib/kitchen';
import { getLowStockItems } from '@/lib/inventory';
import type { ActivityItem } from './_components/activity-list';

export async function getRecentActivities(): Promise<ActivityItem[]> {
  const today = new Date().toISOString().split('T')[0];

  const [salesResult, productionsResult, lowStockResult] = await Promise.allSettled([
    listSales(),
    listProductions({ date_from: today, date_to: today }),
    getLowStockItems(),
  ]);

  const activities: ActivityItem[] = [];

  if (salesResult.status === 'fulfilled') {
    salesResult.value.slice(0, 5).forEach((sale) => {
      activities.push({
        id: `sale-${sale.id}`,
        type: 'sale',
        title: `Order #${sale.id} ${sale.status === 'PAID' ? 'paid' : sale.status.toLowerCase()}`,
        description: `LKR ${parseFloat(sale.total).toLocaleString()} via ${sale.payment_method}`,
        timestamp: sale.created_at ?? sale.sold_at ?? new Date().toISOString(),
        status: sale.status === 'PAID' ? 'completed' : sale.status === 'VOID' ? 'warning' : 'pending',
      });
    });
  }

  if (productionsResult.status === 'fulfilled') {
    productionsResult.value.slice(0, 3).forEach((prod) => {
      const prepared = parseFloat(prod.prepared_qty);
      const planned = parseFloat(prod.planned_qty);
      activities.push({
        id: `prod-${prod.id}`,
        type: 'production',
        title: `${prod.menu_item_name ?? `Item #${prod.menu_item}`} production`,
        description: `Planned: ${prod.planned_qty}, Prepared: ${prod.prepared_qty}`,
        timestamp: prod.updated_at ?? prod.created_at ?? new Date().toISOString(),
        status: prepared >= planned && planned > 0 ? 'completed' : 'pending',
      });
    });
  }

  if (lowStockResult.status === 'fulfilled') {
    lowStockResult.value.slice(0, 3).forEach((item) => {
      activities.push({
        id: `inv-${item.id}`,
        type: 'inventory',
        title: `Low stock: ${item.name}`,
        description: `${item.current_stock} ${item.unit} left (reorder at ${item.reorder_level})`,
        timestamp: new Date().toISOString(),
        status: 'warning',
      });
    });
  }

  activities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  return activities.slice(0, 8);
}

export async function getOverviewData() {
  // Fake delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    views: {
      value: 3456,
      growthRate: 0.43,
    },
    profit: {
      value: 4220,
      growthRate: 4.35,
    },
    products: {
      value: 3456,
      growthRate: 2.59,
    },
    users: {
      value: 3456,
      growthRate: -0.95,
    },
  };
}

export async function getChatsData() {
  // Fake delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return [
    {
      name: "Jacob Jones",
      profile: "/images/user/user-01.png",
      isActive: true,
      lastMessage: {
        content: "See you tomorrow at the meeting!",
        type: "text",
        timestamp: "2024-12-19T14:30:00Z",
        isRead: false,
      },
      unreadCount: 3,
    },
    {
      name: "Wilium Smith",
      profile: "/images/user/user-03.png",
      isActive: true,
      lastMessage: {
        content: "Thanks for the update",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 0,
    },
    {
      name: "Johurul Haque",
      profile: "/images/user/user-04.png",
      isActive: false,
      lastMessage: {
        content: "What's up?",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 0,
    },
    {
      name: "M. Chowdhury",
      profile: "/images/user/user-05.png",
      isActive: false,
      lastMessage: {
        content: "Where are you now?",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 2,
    },
    {
      name: "Akagami",
      profile: "/images/user/user-07.png",
      isActive: false,
      lastMessage: {
        content: "Hey, how are you?",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 0,
    },
  ];
}