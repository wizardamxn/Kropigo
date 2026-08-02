import { Pressable, SectionList, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslations } from 'use-intl';
import { useGetStatementsQuery, useGetStatementsSummaryQuery, type StatementEntry } from '@/store/statementsApi';
import { useAppSelector } from '@/store/hooks';
import { buildStatementHtml, sharePdf } from '@/lib/pdf';
import { rupees } from '@/lib/format';
import { Card, EmptyState, ErrorState, Loading, PageHeader, Screen, StatCard } from '@/components/ui';

export default function Statements() {
  const t = useTranslations('mobile.statements');
  const tErrors = useTranslations('mobile.errors');
  const user = useAppSelector((state) => state.auth.user);
  const { data, isLoading, isError, refetch } = useGetStatementsQuery({ limit: 60 });
  const { data: summaryData } = useGetStatementsSummaryQuery();

  const statements = data?.data ?? [];
  const summary = data?.summary ?? { lifetimeSales: 0, lifetimeAmount: 0 };
  const sections = statements.map((statement) => ({
    title: statement.dateKey,
    total: statement.totalAmount,
    data: statement.entries,
  }));

  const exportPdf = () =>
    sharePdf(buildStatementHtml(statements, summary, user?.name), 'KropiGo-statement.pdf');

  return (
    <Screen>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        right={
          statements.length > 0 ? (
            <Pressable
              onPress={exportPdf}
              className="h-11 w-11 items-center justify-center rounded-full bg-green-50 active:opacity-80 dark:bg-green-950"
            >
              <Ionicons name="download-outline" size={20} color="#166534" />
            </Pressable>
          ) : undefined
        }
      >
        <View className="mt-4 flex-row gap-3">
          <StatCard label={t('lifetimeSales')} value={summary.lifetimeSales} />
          <StatCard label={t('lifetimeEarnings')} value={rupees(summary.lifetimeAmount)} />
        </View>
      </PageHeader>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState message={tErrors('loadStatements')} onRetry={refetch} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => `${item.orderId}-${index}`}
          contentContainerStyle={sections.length ? { padding: 14, paddingBottom: 24 } : { flexGrow: 1, justifyContent: 'center' }}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <EmptyState icon="document-text-outline" title={t('empty')} subtitle={t('emptyHint')} />
          }
          renderSectionHeader={({ section }) => (
            <View className="mb-2 mt-3 flex-row items-center justify-between">
              <Text className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">{section.title}</Text>
              <Text className="text-xs font-bold text-primary">{rupees(section.total)}</Text>
            </View>
          )}
          renderItem={({ item }) => <StatementRow entry={item} />}
          ItemSeparatorComponent={() => <View className="h-2" />}
          ListFooterComponent={
            summaryData?.data.crops.length ? (
              <Card className="mt-5">
                <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">{t('byCrop')}</Text>
                {summaryData.data.crops.slice(0, 6).map((crop) => (
                  <View key={`${crop.cropName}-${crop.grade}`} className="flex-row justify-between py-1">
                    <Text className="flex-1 text-stone-700 dark:text-stone-300" numberOfLines={1}>
                      {crop.cropName}{crop.grade ? ` (${crop.grade})` : ''}
                    </Text>
                    <Text className="font-bold text-stone-900 dark:text-stone-50">{rupees(crop.amount)}</Text>
                  </View>
                ))}
              </Card>
            ) : null
          }
        />
      )}
    </Screen>
  );
}

function StatementRow({ entry }: Readonly<{ entry: StatementEntry }>) {
  return (
    <View className="flex-row items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
      <View className="flex-1">
        <Text className="font-bold text-stone-900 dark:text-stone-50" numberOfLines={1}>
          {entry.cropName}{entry.grade ? ` · Grade ${entry.grade}` : ''}
        </Text>
        <Text className="text-xs text-stone-500 dark:text-stone-400" numberOfLines={1}>
          {entry.quantity} {entry.unit} · {entry.buyerName ?? 'Buyer'}
        </Text>
      </View>
      <Text className="font-extrabold text-primary">{rupees(entry.totalAmount)}</Text>
    </View>
  );
}
