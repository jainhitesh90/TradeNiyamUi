import { useFocusEffect } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native';

import { ApiError, api, endpoints } from '@/api';
import { CustomButton, CustomText, Loader, Screen, useDialog, useToast } from '@/components';
import { styles } from '@/screens/RulesScreen/styles';
import { useTheme } from '@/theme';
import { formatPlainNumber, formatTradeDate, sanitizeDecimal, sanitizeDigits, shortRuleName } from '@/utils';

type TradingRule = {
  code: string;
  name: string;
  description: string;
  value: number | null;
};

type RulesDay = {
  tradeDate: string;
  editable: boolean;
  rules: TradingRule[];
};

const TRADE_COUNT = 'MAX_TRADES_PER_DAY';

const ruleDetails: Record<string, { description: string; icon: SymbolViewProps['name'] }> = {
  MAX_TRADES_PER_DAY: {
    description: 'Maximum no of trades allowed for the day.',
    icon: { ios: 'number', android: 'pin', web: 'pin' },
  },
  MAX_DAILY_LOSS: {
    description: 'Stop trading for the day when maximum loss is reached.',
    icon: { ios: 'indianrupeesign', android: 'trending_down', web: 'trending_down' },
  },
  PROTECT_PROFIT: {
    description: 'Protect profit and stop trading for the day.',
    icon: { ios: 'lock', android: 'lock', web: 'lock' },
  },
};

export function RulesScreen() {
  const { colors } = useTheme();
  const dialog = useDialog();
  const toast = useToast();
  const [day, setDay] = useState<RulesDay | null>(null);
  const [baseline, setBaseline] = useState<Record<string, number | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const loaded = useRef(false);
  const dayRef = useRef(day);
  const baselineRef = useRef(baseline);
  dayRef.current = day;
  baselineRef.current = baseline;

  const load = useCallback((mode: 'initial' | 'silent' | 'refresh') => {
    if (mode === 'refresh') {
      setRefreshing(true);
    }

    return api
      .get<RulesDay>(endpoints.rules, { headers: { Accept: '*/*' } })
      .then((data) => {
        loaded.current = true;
        storeDay(data);
      })
      .catch((err: unknown) => {
        setError(messageFrom(err));
        if (!loaded.current) {
          setDay(null);
        }
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      const current = dayRef.current;
      if (current && changedRules(current.rules, baselineRef.current).length > 0) {
        return;
      }
      load(loaded.current ? 'silent' : 'initial');
    }, [load]),
  );

  const editable = day?.editable === true;
  const hasValue = day?.rules.some((rule) => rule.value !== null) === true;
  const pending = day ? changedRules(day.rules, baseline) : [];

  function storeDay(data: RulesDay) {
    const next = normalizeDay(data);
    setDay(next);
    setBaseline(valuesByCode(next.rules));
    setInputs(inputTextByCode(next.rules));
    setFieldErrors({});
    setError(null);
  }

  function updateRuleText(code: string, raw: string) {
    const text = sanitizeRuleInput(code, raw);
    setInputs((current) => ({ ...current, [code]: text }));
    const parsed = text === '' || text === '.' ? { value: null as number | null, error: null as string | null } : parseRuleValue(code, text);
    setFieldErrors((current) => ({ ...current, [code]: parsed.error ?? '' }));
    if (parsed.error) {
      return;
    }
    setDay((current) => (current ? withRuleValue(current, code, parsed.value) : current));
  }

  function clearRule(rule: TradingRule) {
    if (saving || clearing) {
      return;
    }
    updateRuleText(rule.code, '');
  }

  async function saveRules() {
    if (!day || saving || pending.length === 0) {
      return;
    }

    if (Object.values(fieldErrors).some(Boolean)) {
      return;
    }

    setSaving(true);
    try {
      const data = await api.put<RulesDay>(endpoints.rules, { rules: pending });
      storeDay(data);
      toast.show('Rules saved');
    } catch (err: unknown) {
      setError(messageFrom(err));
    } finally {
      setSaving(false);
    }
  }

  async function deleteAll() {
    if (!day || clearing) {
      return;
    }

    const confirmed = await dialog.confirm({
      title: 'Delete all rules',
      message: 'Every rule for this trading day will be cleared.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!confirmed) {
      return;
    }

    setClearing(true);
    try {
      const data = await api.delete<RulesDay>(endpoints.rules);
      storeDay(data);
      toast.show('Rules deleted');
    } catch (err: unknown) {
      setError(messageFrom(err));
    } finally {
      setClearing(false);
    }
  }

  return (
    <Screen style={styles.container}>
      {loading && !day ? (
        <View style={styles.loading}>
          <Loader />
        </View>
      ) : (
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              if (pending.length > 0) {
                return;
              }
              load('refresh');
            }}
            tintColor={colors.primary}
          />
        }
      >
        {error ? (
          <CustomText id="rules-error" variant="error" style={styles.error}>
            {error}
          </CustomText>
        ) : null}
        {day ? (
          <>
            <CustomText id="rules-date" variant="small">
              You are viewing the rules for {formatTradeDate(day.tradeDate)}.
            </CustomText>
            {editable ? null : (
              <View style={[styles.banner, { backgroundColor: colors.highlight, borderColor: colors.highlightBorder }]}>
                <CustomText id="rules-locked" variant="label" style={{ color: colors.onHighlight }}>
                  Rules are not editable during trading hours
                </CustomText>
                <CustomText id="rules-locked-hint" variant="caption" style={{ color: colors.onHighlight }}>
                  You can change them between 4:00 PM and 9:00 AM.
                </CustomText>
              </View>
            )}
            {day.rules.map((rule) => (
              <RuleCard
                key={rule.code}
                rule={rule}
                text={inputs[rule.code] ?? ''}
                fieldError={fieldErrors[rule.code]}
                editable={editable}
                disabled={saving || clearing}
                onChangeText={(value) => updateRuleText(rule.code, value)}
                onClear={() => clearRule(rule)}
              />
            ))}
            {editable && hasValue ? (
              <Pressable
                testID="rules-delete-all"
                nativeID="rules-delete-all"
                accessibilityRole="button"
                accessibilityLabel="Delete all rules"
                disabled={saving || clearing}
                onPress={deleteAll}
                style={[styles.deleteAll, { borderColor: colors.danger, opacity: saving || clearing ? 0.4 : 1 }]}
              >
                <CustomText id="rules-delete-all-label" variant="danger">
                  {clearing ? 'Deleting…' : 'Delete all rules'}
                </CustomText>
              </Pressable>
            ) : null}
            {editable && pending.length > 0 ? (
              <CustomButton id="rules-save" label="Save" loading={saving} disabled={clearing} onPress={saveRules} />
            ) : null}
          </>
        ) : null}
        {!loading && !error && !day ? (
          <CustomText id="rules-empty" variant="small">
            No rules
          </CustomText>
        ) : null}
      </ScrollView>
      )}
    </Screen>
  );
}

function RuleCard({
  rule,
  text,
  fieldError,
  editable,
  disabled,
  onChangeText,
  onClear,
}: {
  rule: TradingRule;
  text: string;
  fieldError?: string;
  editable: boolean;
  disabled: boolean;
  onChangeText: (value: string) => void;
  onClear: () => void;
}) {
  const { colors } = useTheme();
  const [editing, setEditing] = useState(false);
  const hasValue = rule.value !== null;
  const money = rule.code !== TRADE_COUNT;
  const details = ruleDetails[rule.code];
  const icon = details?.icon ?? { ios: 'checklist', android: 'rule', web: 'rule' };

  function clear() {
    setEditing(false);
    onClear();
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: colors.background }]}>
        <SymbolView name={icon} tintColor={colors.primary} size={18} />
      </View>
      <View style={styles.cardCopy}>
        <CustomText id={`rule-${rule.code}-name`} variant="label" numberOfLines={1}>
          {shortRuleName(rule.name)}
        </CustomText>
        <CustomText id={`rule-${rule.code}-description`} variant="caption" numberOfLines={2}>
          {details?.description ?? shortRuleName(rule.name)}
        </CustomText>
      </View>
      <View style={styles.valueGroup}>
      {money && (editable || hasValue) ? (
        <SymbolView
          name={{ ios: 'indianrupeesign', android: 'currency_rupee', web: 'currency_rupee' }}
          tintColor={colors.text}
          size={16}
        />
      ) : null}
      {editable ? (
        editing ? (
          <TextInput
            testID={`rule-${rule.code}-value`}
            nativeID={`rule-${rule.code}-value`}
            value={text}
            autoFocus
            editable={!disabled}
            keyboardType={rule.code === TRADE_COUNT ? 'number-pad' : 'decimal-pad'}
            placeholder="0"
            placeholderTextColor={colors.textDim}
            maxLength={6}
            selectionColor={colors.primary}
            cursorColor={colors.primary}
            underlineColorAndroid="transparent"
            onChangeText={onChangeText}
            onBlur={() => setEditing(false)}
            accessibilityLabel={shortRuleName(rule.name)}
            style={[
              styles.valueBox,
              styles.input,
              {
                color: colors.text,
                borderColor: fieldError ? colors.danger : colors.primary,
                outlineColor: fieldError ? colors.danger : colors.primary,
                backgroundColor: colors.background,
              },
            ]}
          />
        ) : (
          <Pressable
            testID={`rule-${rule.code}-value`}
            nativeID={`rule-${rule.code}-value`}
            accessibilityRole="button"
            accessibilityLabel={hasValue ? formatPlainNumber(rule.value) : `Set ${shortRuleName(rule.name)}`}
            disabled={disabled}
            onPress={() => setEditing(true)}
            style={[
              styles.valueBox,
              {
                borderColor: fieldError ? colors.danger : colors.border,
                backgroundColor: colors.background,
                opacity: disabled ? 0.4 : 1,
              },
            ]}
          >
            <CustomText
              id={`rule-${rule.code}-value-label`}
              variant="label"
              numberOfLines={1}
              style={[styles.value, { color: hasValue ? colors.text : colors.link }]}
            >
              {hasValue ? formatPlainNumber(rule.value) : 'Set'}
            </CustomText>
          </Pressable>
        )
      ) : (
        <CustomText id={`rule-${rule.code}-value`} variant="label" numberOfLines={1} style={styles.value}>
          {hasValue ? formatPlainNumber(rule.value) : ''}
        </CustomText>
      )}
      </View>
      </View>
      {editable && hasValue ? (
        <Pressable
          testID={`rule-${rule.code}-clear`}
          nativeID={`rule-${rule.code}-clear`}
          accessibilityRole="button"
          accessibilityLabel={`Clear ${shortRuleName(rule.name)}`}
          disabled={disabled}
          hitSlop={8}
          onPress={clear}
          style={[
            styles.cancel,
            { opacity: disabled ? 0.35 : 1 },
          ]}
        >
          <SymbolView
            name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
            tintColor={colors.danger}
            size={18}
          />
        </Pressable>
      ) : null}
      {fieldError ? (
        <CustomText id={`rule-${rule.code}-error`} variant="caption" style={[styles.fieldError, { color: colors.danger }]}>
          {fieldError}
        </CustomText>
      ) : null}
    </View>
  );
}

function inputTextByCode(rules: TradingRule[]): Record<string, string> {
  return Object.fromEntries(rules.map((rule) => [rule.code, formatPlainNumber(rule.value)]));
}

function valuesByCode(rules: TradingRule[]): Record<string, number | null> {
  return Object.fromEntries(rules.map((rule) => [rule.code, rule.value]));
}

function changedRules(rules: TradingRule[], baseline: Record<string, number | null>) {
  return rules.flatMap((rule) => {
    const previous = baseline[rule.code] ?? null;
    if (previous === rule.value) {
      return [];
    }
    return [{ code: rule.code, value: rule.value }];
  });
}

function withRuleValue(day: RulesDay, code: string, value: number | null): RulesDay {
  return {
    ...day,
    rules: day.rules.map((item) => (item.code === code ? { ...item, value } : item)),
  };
}

function normalizeDay(data: RulesDay | null | undefined): RulesDay {
  return {
    tradeDate: typeof data?.tradeDate === 'string' ? data.tradeDate : '',
    editable: data?.editable === true,
    rules: Array.isArray(data?.rules) ? data.rules.map(normalizeRule) : [],
  };
}

function normalizeRule(rule: Partial<TradingRule>): TradingRule {
  const amount = typeof rule.value === 'number' ? rule.value : Number(rule.value);
  return {
    code: typeof rule.code === 'string' ? rule.code : '',
    name: typeof rule.name === 'string' ? rule.name : '',
    description: typeof rule.description === 'string' ? rule.description : '',
    value: rule.value === null || rule.value === undefined || !Number.isFinite(amount) ? null : amount,
  };
}

function sanitizeRuleInput(code: string, value: string): string {
  if (code === TRADE_COUNT) {
    return sanitizeDigits(value);
  }
  return sanitizeDecimal(value);
}

function parseRuleValue(code: string, value: string): { value: number; error: null } | { value: null; error: string } {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '.') {
    return { value: null, error: 'Enter a value' };
  }
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount < 0) {
    return { value: null, error: 'Enter a number that is 0 or more' };
  }
  if (code === TRADE_COUNT && !Number.isInteger(amount)) {
    return { value: null, error: 'Enter a whole number' };
  }
  return { value: amount, error: null };
}

function messageFrom(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return error instanceof Error ? error.message : 'Request failed';
}
