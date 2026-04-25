import React, { useState, useEffect } from "react";
import { 
  Text, 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TextInput,
  Linking,
  Alert
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PieChart } from "react-native-chart-kit";
import { Theme } from "../styles/Theme";
import { GlobalStyles } from "../styles/GlobalStyles";

import { Config } from "../Config";

const API_BASE = Config.API_BASE;
const API_KEY = Config.API_KEY;
const screenWidth = Dimensions.get("window").width;

export default function FinancePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchFinanceData();
  }, [fromDate, toDate]);

  const fetchFinanceData = async () => {
    try {
      const response = await fetch(`${API_BASE}?action=get_finance_summary&from=${fromDate}&to=${toDate}`, {
        headers: { "X-API-KEY": API_KEY }
      });
      const json = await response.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFinanceData();
  };

  const resetFilters = () => {
    const today = new Date().toISOString().split('T')[0];
    setFromDate(today);
    setToDate(today);
  };

  const exportCSV = () => {
    const url = `${API_BASE}?action=export_finance_csv&from=${fromDate}&to=${toDate}&api_key=${API_KEY}`;
    Linking.openURL(url).catch(err => Alert.alert("Error", "Could not open export link"));
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#059669" /></View>;

  const pieData = stats?.type_stats.map((t: any, i: number) => ({
    name: t.followup_type,
    population: parseFloat(t.total),
    color: ['#059669', '#0284C7', '#7C3AED', '#EA580C'][i % 4],
    legendFontColor: "#64748B",
    legendFontSize: 12
  })) || [];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: "Finance & Accounting",
        headerStyle: { backgroundColor: '#059669' },
        headerTintColor: '#fff',
      }} />
      
      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.dashboardHeader}>
          <View style={styles.revenueCard}>
            <View style={styles.cardOverlay}>
              <Text style={styles.summaryLabel}>Total Revenue (Selected Range)</Text>
              <Text style={styles.totalAmount}>₹{stats?.range_total.toLocaleString()}</Text>
              <View style={styles.statsDivider} />
              <View style={styles.grid}>
                <View style={styles.miniCard}>
                  <Text style={styles.miniLabel}>Monthly</Text>
                  <Text style={styles.miniAmount}>₹{stats?.month.toLocaleString()}</Text>
                </View>
                <View style={styles.miniCard}>
                  <Text style={styles.miniLabel}>Lifetime</Text>
                  <Text style={styles.miniAmount}>₹{stats?.total.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Advanced Filters */}
        <View style={styles.filterSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="funnel" size={18} color={Theme.colors.primary} />
            <Text style={styles.sectionTitle}>Reporting Filters</Text>
          </View>
          <View style={styles.filterRow}>
            <View style={styles.dateInputBox}>
              <Text style={styles.filterLabel}>From Date</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="calendar-outline" size={16} color="#64748B" />
                <TextInput 
                  style={styles.dateInput} 
                  value={fromDate}
                  onChangeText={setFromDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>
            <View style={styles.dateInputBox}>
              <Text style={styles.filterLabel}>To Date</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="calendar-outline" size={16} color="#64748B" />
                <TextInput 
                  style={styles.dateInput} 
                  value={toDate}
                  onChangeText={setToDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>
          </View>
          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
              <Ionicons name="refresh" size={16} color="#64748B" />
              <Text style={styles.resetText}>Reset to Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportBtn} onPress={exportCSV}>
              <Ionicons name="cloud-download" size={18} color="white" />
              <Text style={styles.exportText}>Export Report</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Analytics Section */}
        <View style={styles.analyticsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pie-chart" size={18} color={Theme.colors.success} />
            <Text style={styles.sectionTitle}>Income Distribution</Text>
          </View>
          <View style={styles.chartCard}>
            {pieData.length > 0 ? (
              <PieChart
                data={pieData}
                width={screenWidth - 60}
                height={200}
                chartConfig={{
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                }}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                center={[10, 0]}
                absolute
              />
            ) : (
              <View style={styles.noDataBox}>
                <Text style={styles.noDataText}>No revenue data for this range.</Text>
              </View>
            )}
          </View>
        </View>

        {/* History Section */}
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={18} color={Theme.colors.warning} />
            <Text style={styles.sectionTitle}>Transaction History</Text>
          </View>
          {stats?.history.map((h: any) => (
            <TouchableOpacity 
              key={h.id} 
              style={styles.transactionCard}
              onPress={() => router.push({ pathname: "/patient/[id]", params: { id: h.patient_id } })}
            >
              <View style={styles.transMain}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{h.patient_name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.patientName}>{h.patient_name}</Text>
                  <Text style={styles.transDate}>{new Date(h.followup_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </View>
                <View style={styles.amountBox}>
                  <Text style={styles.transAmount}>₹{h.fee}</Text>
                  <View style={styles.typeTag}>
                    <Text style={styles.typeText}>{h.followup_type}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { flex: 1 },
  
  dashboardHeader: { padding: 15, paddingTop: 10 },
  revenueCard: { backgroundColor: "#059669", borderRadius: 24, overflow: 'hidden', elevation: 8, shadowColor: "#059669", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  cardOverlay: { padding: 25, backgroundColor: 'rgba(0,0,0,0.05)' },
  summaryLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "600", textTransform: 'uppercase', letterSpacing: 1 },
  totalAmount: { color: "white", fontSize: 42, fontWeight: "900", marginVertical: 10 },
  statsDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.2)", marginVertical: 15 },
  grid: { flexDirection: "row", gap: 15 },
  miniCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.1)", padding: 15, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  miniLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  miniAmount: { color: "white", fontSize: 18, fontWeight: "800", marginTop: 4 },

  filterSection: { backgroundColor: "white", margin: 15, padding: 20, borderRadius: 20, elevation: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 15 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#1E293B", textTransform: 'uppercase', letterSpacing: 0.5 },
  filterRow: { flexDirection: "row", gap: 12 },
  dateInputBox: { flex: 1 },
  filterLabel: { fontSize: 11, fontWeight: "700", color: "#64748B", marginBottom: 6, textTransform: 'uppercase' },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F5F9", borderRadius: 10, paddingHorizontal: 10, borderWidth: 1, borderColor: "#E2E8F0" },
  dateInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 13, color: "#1E293B", fontWeight: '600' },
  filterActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 15 },
  resetBtn: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8 },
  resetText: { color: "#64748B", fontSize: 13, fontWeight: "700" },
  exportBtn: { backgroundColor: "#1E293B", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, elevation: 4 },
  exportText: { color: "white", fontSize: 14, fontWeight: "800" },

  analyticsSection: { paddingHorizontal: 15, marginBottom: 20 },
  chartCard: { backgroundColor: "white", padding: 15, borderRadius: 24, elevation: 2, alignItems: 'center' },
  noDataBox: { height: 100, justifyContent: 'center', alignItems: 'center' },
  noDataText: { color: '#94A3B8', fontSize: 14, fontStyle: 'italic' },

  historySection: { paddingHorizontal: 15 },
  transactionCard: { backgroundColor: "white", padding: 15, borderRadius: 20, marginBottom: 12, elevation: 1, borderWidth: 1, borderColor: '#F1F5F9' },
  transMain: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#F0F9FF", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 18, fontWeight: "800", color: "#0284C7" },
  patientName: { fontSize: 15, fontWeight: "800", color: "#1E293B" },
  transDate: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  amountBox: { alignItems: "flex-end" },
  transAmount: { fontSize: 17, fontWeight: "900", color: "#059669" },
  typeTag: { backgroundColor: "#ECFDF5", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 4 },
  typeText: { fontSize: 10, fontWeight: "800", color: "#059669", textTransform: 'uppercase' },
});
