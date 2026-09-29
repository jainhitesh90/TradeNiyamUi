import { useCallback, useEffect, useRef, useState } from 'react';
import { SectionList, View } from 'react-native';

import { ApiError, api, endpoints } from '@/api';
import { CustomText, Loader, Screen } from '@/components';
import { styles } from '@/screens/OrdersScreen/styles';
import { useTheme } from '@/theme';
import { formatPrice } from '@/utils';

const PAGE_SIZE = 20;

type Order = {
  order_id: string;
  broker_order_id?: string;
  trading_symbol: string;
  order_status: string;
  quantity: number;
  price: number;
  filled_quantity: number;
  average_fill_price: number;
  order_type: string;
  transaction_type: string;
  product: string;
  created_at: string;
  exchange_time: string;
};

type OrdersPage = {
  orders?: ApiOrder[];
  totalCount?: number;
  offset?: number;
  limit?: number;
};

type ApiOrder = Partial<Order> & {
  orderId?: string;
  brokerOrderId?: string;
  tradingSymbol?: string;
  orderStatus?: string;
  quantity?: number;
  price?: number;
  filledQuantity?: number;
  averageFillPrice?: number;
  orderType?: string;
  transactionType?: string;
  createdAt?: string;
  exchange_time?: string;
  exchangeTime?: string;
};

type OrderSection = {
  title: string;
  data: Order[];
};

export function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const paging = useRef(false);

  const loadPage = useCallback((offset: number) => {
    const firstPage = offset === 0;
    if (!firstPage) {
      paging.current = true;
      setLoadingMore(true);
    }

    return api
      .get<OrdersPage>(endpoints.orders, {
        query: { offset, limit: PAGE_SIZE },
        headers: { Accept: '*/*' },
      })
      .then((data) => {
        const rawOrders = data && Array.isArray(data.orders) ? data.orders : [];
        const page = rawOrders.map(normalizeOrder);
        setTotalCount(typeof data?.totalCount === 'number' ? data.totalCount : page.length);
        setOrders((current) => (firstPage ? page : mergeOrders(current, page)));
        setError(null);
      })
      .catch((err: unknown) => {
        const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Request failed';
        if (firstPage) {
          setError(message);
          setOrders([]);
        }
      })
      .finally(() => {
        if (firstPage) {
          setLoading(false);
        }
        paging.current = false;
        setLoadingMore(false);
      });
  }, []);

  useEffect(() => {
    loadPage(0);
  }, [loadPage]);

  function loadMore() {
    if (paging.current || loading || loadingMore || orders.length === 0 || orders.length >= totalCount) {
      return;
    }
    loadPage(orders.length);
  }

  const sections = groupByDate(orders);

  return (
    <Screen style={styles.container}>
      {loading ? <Loader /> : null}
      {error ? (
        <CustomText id="orders-error" variant="error" style={styles.error}>
          {error}
        </CustomText>
      ) : null}
      {!loading && !error && orders.length === 0 ? (
        <CustomText id="orders-empty" variant="small" style={styles.empty}>
          No orders
        </CustomText>
      ) : null}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.order_id || `${item.trading_symbol}-${item.exchange_time}`}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        renderSectionHeader={({ section }) => <DateHeader title={section.title} />}
        renderItem={({ item }) => <OrderRow order={item} />}
        ListFooterComponent={loadingMore ? <View style={styles.footer}><Loader /></View> : null}
      />
    </Screen>
  );
}

function DateHeader({ title }: { title: string }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.dateHeader,
        {
          backgroundColor: colors.background,
          boxShadow: `0 -3px 0 3px ${colors.background}`,
        },
      ]}
    >
      <CustomText id={`orders-date-${title}`} variant="body" style={styles.dateTitle}>
        {title}
      </CustomText>
    </View>
  );
}

function OrderRow({ order }: { order: Order }) {
  const { colors } = useTheme();
  const id = order.order_id || order.trading_symbol;
  const buy = order.transaction_type === 'BUY';
  const executed = order.order_status === 'EXECUTED';

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.left}>
        <CustomText id={`order-${id}-side`} variant="caption" style={{ color: buy ? colors.success : colors.danger }}>
          {order.transaction_type} · {titleCase(order.order_type)}
        </CustomText>
        <CustomText
          id={`order-${id}-symbol`}
          variant="small"
          numberOfLines={1}
          style={[styles.symbol, { color: colors.textSecondary }]}
        >
          {formatContractName(order.trading_symbol)}
        </CustomText>
        <CustomText id={`order-${id}-time`} variant="caption" style={{ color: colors.textMuted }}>
          {formatOrderTime(order.exchange_time)}
        </CustomText>
      </View>
      <View style={styles.right}>
        <CustomText id={`order-${id}-product`} variant="caption" style={{ color: colors.textMuted }}>
          {productLabel(order.product)}
        </CustomText>
        <View style={styles.qtyRow}>
          <View style={[styles.dot, { backgroundColor: executed ? colors.success : colors.danger }]} />
          <CustomText id={`order-${id}-qty`} variant="small" style={[styles.symbol, { color: colors.textSecondary }]}>
            {displayQuantity(order)}
          </CustomText>
        </View>
        <CustomText id={`order-${id}-avg`} variant="caption" style={{ color: colors.textMuted }}>
          Avg ₹{formatPrice(displayPrice(order))}
        </CustomText>
      </View>
    </View>
  );
}

function normalizeOrder(raw: ApiOrder): Order {
  return {
    order_id: text(raw.order_id ?? raw.orderId),
    broker_order_id: text(raw.broker_order_id ?? raw.brokerOrderId),
    trading_symbol: text(raw.trading_symbol ?? raw.tradingSymbol),
    order_status: text(raw.order_status ?? raw.orderStatus),
    quantity: numberValue(raw.quantity),
    price: numberValue(raw.price),
    filled_quantity: numberValue(raw.filled_quantity ?? raw.filledQuantity),
    average_fill_price: numberValue(raw.average_fill_price ?? raw.averageFillPrice),
    order_type: text(raw.order_type ?? raw.orderType),
    transaction_type: text(raw.transaction_type ?? raw.transactionType),
    product: text(raw.product),
    created_at: text(raw.created_at ?? raw.createdAt),
    exchange_time: text(raw.exchange_time ?? raw.exchangeTime),
  };
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function displayQuantity(order: Order): number {
  return order.filled_quantity > 0 ? order.filled_quantity : order.quantity;
}

function displayPrice(order: Order): number {
  return order.average_fill_price > 0 ? order.average_fill_price : order.price;
}

function numberValue(value: unknown): number {
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function mergeOrders(current: Order[], page: Order[]): Order[] {
  const seen = new Set(current.map((order) => order.order_id));
  const next = page.filter((order) => !seen.has(order.order_id));
  return [...current, ...next];
}

function groupByDate(orders: Order[]): OrderSection[] {
  const sections: OrderSection[] = [];
  for (const order of orders) {
    const title = formatOrderDate(order.created_at);
    const last = sections[sections.length - 1];
    if (last?.title === title) {
      last.data.push(order);
    } else {
      sections.push({ title, data: [order] });
    }
  }
  return sections;
}

function formatOrderDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatOrderTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function titleCase(value: string): string {
  if (value.length === 2) {
    return value;
  }
  const lower = value.toLowerCase();
  return lower ? `${lower[0].toUpperCase()}${lower.slice(1)}` : '';
}

function productLabel(product: string): string {
  if (product === 'NRML' || product === 'CNC') {
    return 'Delivery';
  }
  if (product === 'MIS') {
    return 'Intraday';
  }
  return product;
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] as const;
const MONTHLY_CONTRACT = /^([A-Z]+?)(\d{2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d+(?:\.\d+)?)(CE|PE)$/;

function formatContractName(symbol: string): string {
  if (!symbol) {
    return '';
  }
  const match = MONTHLY_CONTRACT.exec(symbol);
  if (!match) {
    return symbol;
  }

  const [, underlying, year, month, strike, option] = match;
  const monthIndex = MONTHS.indexOf(month as (typeof MONTHS)[number]);
  const expiryDay = lastTuesday(2000 + Number(year), monthIndex);
  const monthLabel = `${month[0]}${month.slice(1).toLowerCase()}`;
  const optionLabel = option === 'CE' ? 'Call' : 'Put';
  return `${underlying} ${expiryDay} ${monthLabel} ${strike} ${optionLabel}`;
}

function lastTuesday(year: number, monthIndex: number): number {
  const lastDay = new Date(year, monthIndex + 1, 0);
  const daysAfterTuesday = (lastDay.getDay() - 2 + 7) % 7;
  return lastDay.getDate() - daysAfterTuesday;
}
