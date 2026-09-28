import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { ApiError, api, endpoints } from '@/api';
import { CustomText, Loader, Screen } from '@/components';
import { styles } from '@/screens/PositionScreen/styles';
import { useTheme } from '@/theme';

type Position = {
  trading_symbol: string;
  segment: string;
  credit_quantity: number;
  credit_price: number;
  debit_quantity: number;
  debit_price: number;
  exchange: string;
  quantity: number;
  product: string;
  net_price: number;
  realised_pnl: number;
  unrealised_pnl?: number;
};

type PositionsResponse = {
  positions?: Position[];
  total_p_and_l?: number;
};

export function PositionScreen() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [totalPnl, setTotalPnl] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .get<PositionsResponse>(endpoints.position, {
        headers: { Accept: '*/*' },
      })
      .then((data) => {
        if (cancelled) {
          return;
        }
        setPositions(Array.isArray(data.positions) ? data.positions : []);
        const total = Number(data.total_p_and_l);
        setTotalPnl(Number.isFinite(total) ? total : null);
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
      {loading ? <Loader /> : null}
      {error ? (
        <CustomText id="position-error" variant="error" style={styles.error}>
          {error}
        </CustomText>
      ) : null}
      {totalPnl !== null ? <TotalPnl value={totalPnl} /> : null}
      {!loading && !error && positions.length === 0 ? (
        <CustomText id="position-empty" variant="small" style={styles.empty}>
          No positions
        </CustomText>
      ) : null}
      <FlatList
        data={positions}
        keyExtractor={(item, index) => `${item.trading_symbol}-${item.product}-${item.exchange}-${index}`}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => <PositionRow position={item} index={index} />}
      />
    </Screen>
  );
}

function TotalPnl({ value }: { value: number }) {
  const { colors } = useTheme();
  const amountColor = value < 0 ? colors.danger : value > 0 ? colors.success : colors.text;

  return (
    <View style={[styles.totalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.totalCopy}>
        <CustomText id="position-total-label" variant="caption" style={[styles.totalLabel, { color: colors.textMuted }]}>
          TOTAL P&L
        </CustomText>
        <CustomText id="position-total-value" variant="medium" style={[styles.totalValue, { color: amountColor }]}>
          {formatPnl(value)}
        </CustomText>
      </View>
    </View>
  );
}

function PositionRow({ position, index }: { position: Position; index: number }) {
  const { colors, isDark } = useTheme();
  const id = `${position.trading_symbol}-${index}`;
  const pnl = shownPnl(position);
  const rowBackground = pnl.unrealised
    ? isDark
      ? '#1A2421'
      : '#F3FAF7'
    : isDark
      ? '#1A1A1C'
      : '#F4F4F5';
  const amountColor = pnl.value < 0 ? colors.danger : pnl.value > 0 ? colors.success : colors.text;

  return (
    <View style={[styles.row, { borderBottomColor: colors.border, backgroundColor: rowBackground }]}>
      <View style={styles.left}>
        <CustomText id={`position-${id}-meta`} variant="caption" style={{ color: colors.textMuted }}>
          {productLabel(position.product)} · {position.exchange}
        </CustomText>
        <CustomText id={`position-${id}-symbol`} variant="body" numberOfLines={1} style={styles.symbol}>
          {formatContractName(position.trading_symbol)}
        </CustomText>
        <CustomText id={`position-${id}-fills`} variant="caption" numberOfLines={1} style={{ color: colors.textMuted }}>
          <Text style={{ color: colors.success }}>B</Text> {formatFill(position.credit_quantity, position.credit_price)}
          {' · '}
          <Text style={{ color: colors.danger }}>S</Text> {formatFill(position.debit_quantity, position.debit_price)}
        </CustomText>
      </View>
      <View style={styles.right}>
        <View style={styles.rightSpacer} />
        <CustomText id={`position-${id}-pnl`} variant="small" style={[styles.pnl, { color: amountColor }]}>
          {formatPnl(pnl.value)}
        </CustomText>
        <CustomText id={`position-${id}-mkt`} variant="caption" style={{ color: colors.textMuted }}>
          Mkt {formatRupee(position.net_price)}
        </CustomText>
      </View>
    </View>
  );
}

function shownPnl(position: Position): { value: number; unrealised: boolean } {
  const unrealised = position.unrealised_pnl;
  if (typeof unrealised === 'number' && unrealised !== 0) {
    return { value: unrealised, unrealised: true };
  }
  return { value: position.realised_pnl, unrealised: false };
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] as const;

const MONTHLY_CONTRACT = /^([A-Z]+?)(\d{2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d+(?:\.\d+)?)(CE|PE)$/;

function formatContractName(symbol: string): string {
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

function productLabel(product: string): string {
  if (product === 'NRML' || product === 'CNC') {
    return 'Delivery';
  }
  if (product === 'MIS') {
    return 'Intraday';
  }
  return product;
}

function formatFill(quantity: number, price: number): string {
  const qty = Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2);
  return `${qty} ${formatRupee(price)}`;
}

function formatRupee(value: number): string {
  const amount = Math.abs(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `₹${amount}`;
}

function formatPnl(value: number): string {
  const amount = formatRupee(value);
  return value < 0 ? `-${amount}` : amount;
}
