import { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';

import { ApiError, api, endpoints } from '@/api';
import { Card, CustomText, Loader, Screen } from '@/components';
import { styles } from '@/screens/OrdersScreen/styles';
import { formatPrice } from '@/utils';

type Order = {
  groww_order_id: string;
  trading_symbol: string;
  order_status: string;
  quantity: number;
  filled_quantity: number;
  average_fill_price: number;
  exchange: string;
  order_type: string;
  transaction_type: string;
  product: string;
  created_at: string;
};

type OrdersData = {
  status?: string | null;
  payload?: {
    order_list?: Order[];
  };
};

export function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .get<OrdersData>(endpoints.orders, {
        query: { segment: 'FNO', page: 0, page_size: 100 },
        headers: { Accept: '*/*' },
      })
      .then((data) => {
        if (cancelled) {
          return;
        }
        setStatus(data.status ?? null);
        setOrders(data.payload?.order_list ?? []);
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError) {
          setError(err.message);
          return;
        }
        setError(err instanceof Error ? err.message : 'Request failed');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Screen style={styles.container}>
      <CustomText id="orders-title" variant="large">
        Orders
      </CustomText>
      <CustomText id="orders-subtitle" variant="small" style={styles.subtitle}>
        F&O orders{status ? ` · ${status}` : ''}
      </CustomText>
      {loading ? <Loader /> : null}
      {error ? (
        <CustomText id="orders-error" variant="error" style={styles.error}>
          {error}
        </CustomText>
      ) : null}
      {!loading && !error && orders.length === 0 ? (
        <CustomText id="orders-empty" variant="small">
          No orders
        </CustomText>
      ) : null}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.groww_order_id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <OrderRow order={item} />}
      />
    </Screen>
  );
}

function OrderRow({ order }: { order: Order }) {
  const id = order.groww_order_id;

  return (
    <Card style={styles.orderCard}>
      <View style={styles.row}>
        <CustomText id={`order-${id}-symbol`} variant="body" style={styles.symbol}>
          {order.trading_symbol}
        </CustomText>
        <CustomText id={`order-${id}-side`} variant={order.transaction_type === 'BUY' ? 'success' : 'danger'}>
          {order.transaction_type}
        </CustomText>
      </View>
      <CustomText id={`order-${id}-status`} variant="small">
        {order.order_status} · {order.order_type} · {order.exchange} · {order.product}
      </CustomText>
      <CustomText id={`order-${id}-qty`} variant="small">
        Qty {order.filled_quantity}/{order.quantity} · Avg {formatPrice(order.average_fill_price)}
      </CustomText>
      <CustomText id={`order-${id}-time`} variant="caption">
        {order.created_at}
      </CustomText>
    </Card>
  );
}
