import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
  Alert,
  ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack, useFocusEffect } from "expo-router";
import { Calendar } from "react-native-calendars";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

import { Config } from "../Config";

const { width } = Dimensions.get("window");

const API_BASE = Config.API_BASE;
const API_KEY = Config.API_KEY;

type TabType = "Home" | "Patients" | "Reminders";

export default function Index() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("Home");
  const [data, setData] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState<any>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    let action = "";
    if (activeTab === "Patients") action = "get_patients";
    else if (activeTab === "Reminders") action = "get_daily_reminders";
    else if (activeTab === "Home") action = "get_dashboard_stats";

    try {
      let url = `${API_BASE}?action=${action}&search=${encodeURIComponent(searchQuery)}`;
      if (activeTab === "Reminders") {
        url += `&date=${selectedDate}`;
      }

      const response = await fetch(url, {
        headers: { "X-API-KEY": API_KEY }
      });

      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        throw new Error("Empty response from server");
      }

      const json = JSON.parse(text);
      if (json.success) {
        if (activeTab === "Home") {
          setDashboardStats(json.data);
        } else {
          setData(json.data);
        }
      } else {
        setError(json.message || "Failed to fetch data");
      }
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setError(err.message || "Network request failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, searchQuery, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const fetchMarkedDates = async () => {
    try {
      const response = await fetch(`${API_BASE}?action=get_reminder_counts`, {
        headers: { "X-API-KEY": API_KEY }
      });
      
      if (!response.ok) return;
      
      const text = await response.text();
      if (!text) return;
      
      const json = JSON.parse(text);
      if (json.success) {
        setMarkedDates({
          ...json.data,
          [selectedDate]: {
            ...json.data[selectedDate],
            selected: true,
            selectedColor: '#EA580C'
          }
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (activeTab === "Reminders") {
      fetchMarkedDates();
    }
  }, [activeTab, selectedDate]);

  const deleteItem = (id: number, type: "Category" | "Campaign") => {
    Alert.alert(
      `Delete ${type}`,
      `Are you sure you want to delete this ${type.toLowerCase()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              let action = "";
              if (type === "Category") action = "delete_category";
              else if (type === "Campaign") action = "delete_campaign";
              else if (type === "Templates") action = "delete_template";
              else if (type === "Reminders") action = "delete_followup";

              const response = await fetch(`${API_BASE}?action=${action}&id=${id}`, {
                headers: { "X-API-KEY": API_KEY }
              });
              const json = await response.json();
              if (json.success) {
                fetchData();
              }
            } catch (error) {
              console.error(error);
            }
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderHome = () => {
    if (!dashboardStats) return <ActivityIndicator size="large" color="#0284C7" style={{ marginTop: 50 }} />;

    return (
      <ScrollView style={styles.homeContainer}>
        {/* Real-Life Onboarding Hub */}
        <View style={styles.onboardingCard}>
          <View style={styles.onboardingHeader}>
            <Ionicons name="medical" size={20} color="#0284C7" />
            <Text style={styles.onboardingTitle}>Doctor's Counter Check-in</Text>
          </View>
          <Text style={styles.onboardingSub}>Start a session for the next patient</Text>

          <View style={styles.onboardingActions}>
            <TouchableOpacity
              style={[styles.onboardingBtn, { backgroundColor: '#0284C7' }]}
              onPress={() => router.push("/add-patient")}
            >
              <View style={styles.onboardingIconBox}>
                <Ionicons name="person-add" size={22} color="white" />
              </View>
              <View>
                <Text style={styles.onboardingBtnText}>New</Text>
                <Text style={styles.onboardingBtnSub}>Patient Reg.</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.onboardingBtn, { backgroundColor: '#059669' }]}
              onPress={() => router.push({ pathname: "/add-followup", params: { searchMode: 'phone' } })}
            >
              <View style={styles.onboardingIconBox}>
                <Ionicons name="repeat" size={22} color="white" />
              </View>
              <View>
                <Text style={styles.onboardingBtnText}>Old </Text>
                <Text style={styles.onboardingBtnSub}>Patient Followup</Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.onboardingBtn, { backgroundColor: '#7C3AED', marginTop: 10 }]}
            onPress={() => router.push("/today-appointments")}
          >
            <View style={styles.onboardingIconBox}>
              <Ionicons name="list" size={22} color="white" />
            </View>
            <View>
              <Text style={styles.onboardingBtnText}>Today Queue List</Text>
              <Text style={styles.onboardingBtnSub}>Live Patient Appointments</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#F0F9FF' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#BAE6FD' }]}>
              <Ionicons name="people" size={20} color="#0284C7" />
            </View>
            <Text style={styles.statValue}>{dashboardStats.patients}</Text>
            <Text style={styles.statLabel}>Total Patients</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFF7ED' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#FFEDD5' }]}>
              <Ionicons name="calendar" size={20} color="#EA580C" />
            </View>
            <Text style={styles.statValue}>{dashboardStats.today_reminders}</Text>
            <Text style={styles.statLabel}>Today Queue</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#ECFDF5' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="sparkles" size={20} color="#059669" />
            </View>
            <Text style={styles.statValue}>{dashboardStats.new_patients}</Text>
            <Text style={styles.statLabel}>New (7 Days)</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F5F3FF' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="shield-checkmark" size={20} color="#7C3AED" />
            </View>
            <Text style={styles.statValue}>{dashboardStats.old_patients}</Text>
            <Text style={styles.statLabel}>Old Patients</Text>
          </View>

        </View>

        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Patient Growth (Last 7 Days)</Text>
          <LineChart
            data={{
              labels: dashboardStats.growth_labels || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
              datasets: [{ data: dashboardStats.growth || [0, 0, 0, 0, 0, 0, 0] }]
            }}
            width={width - 40}
            height={200}
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(2, 132, 199, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: "6", strokeWidth: "2", stroke: "#0284C7" }
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/add-patient")}>
              <Ionicons name="person-add" size={24} color="#0284C7" />
              <Text style={styles.actionText}>Add Patient</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/add-followup")}>
              <Ionicons name="time" size={24} color="#EA580C" />
              <Text style={styles.actionText}>Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/start-campaign")}>
              <Ionicons name="megaphone-outline" size={24} color="#6366F1" />
              <Text style={styles.actionText}>Bulk Campaign</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 50 }} />
      </ScrollView>
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    if (activeTab === "Patients") {
      const genderColor = item.gender === "Male" ? "#0284C7" : (item.gender === "Female" ? "#DB2777" : "#64748B");
      return (
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => router.push({ pathname: "/patient/[id]", params: { id: item.id } })}
        >
          <View style={[styles.avatarCircle, { backgroundColor: genderColor + '15' }]}>
            <Ionicons
              name="person-outline"
              size={24}
              color={genderColor}
            />
          </View>
          <View style={styles.itemContent}>
            <View style={styles.nameRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={[styles.ageTag, { backgroundColor: genderColor + '10', color: genderColor }]}>
                {item.age} {item.age_unit === 'Y' ? 'yrs' : (item.age_unit === 'M' ? 'mos' : 'days')}
              </Text>
            </View>
            <Text style={styles.itemSub}>{item.phone}</Text>
            {item.address && <Text style={styles.itemAddress} numberOfLines={1}>{item.address}</Text>}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
        </TouchableOpacity>
      );
    } else if (activeTab === "Reminders") {
      return (
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => router.push({ pathname: "/patient/[id]", params: { id: item.patient_id } })}
        >
          <View style={[styles.avatarCircle, { backgroundColor: (item.gender === "Female" ? "#DB2777" : "#0284C7") + '15' }]}>
            <Ionicons
              name="person-outline"
              size={24}
              color={item.gender === "Female" ? "#DB2777" : "#0284C7"}
            />
          </View>
          <View style={styles.itemContent}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{item.patient_name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: item.status === 'Completed' ? '#ECFDF5' : '#FFF7ED' }]}>
                <Text style={[styles.statusText, { color: item.status === 'Completed' ? '#059669' : '#EA580C' }]}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.itemSubtext}>{item.followup_type}: {item.notes}</Text>
          </View>
        </TouchableOpacity>
      );
    } else {
      return null;
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="#0284C7" translucent={false} />

      <SafeAreaView edges={['top']} style={{ backgroundColor: '#0284C7' }} />

      {/* Modern Medical Header */}
      <View style={styles.header}>
        {isSearching ? (
          <View style={styles.searchBar}>
            <TouchableOpacity onPress={() => { setIsSearching(false); setSearchQuery(""); fetchData(); }}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              placeholderTextColor="#CBD5E1"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              onSubmitEditing={fetchData}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(""); fetchData(); }}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <View style={styles.headerBrand}>
              {activeTab === "Reminders" && (
                <TouchableOpacity onPress={() => setActiveTab("Patients")} style={{ marginRight: 10 }}>
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
              )}
              <View style={styles.logoBadge}>
                <Ionicons name="pulse-outline" size={20} color="#0284C7" />
              </View>
              <Text style={styles.headerTitle}>{activeTab === "Reminders" ? "Daily Reminders" : "DocCRM"}</Text>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.headerBtn} onPress={() => setIsSearching(true)}>
                <Ionicons name="search-outline" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn} onPress={() => router.push("/settings")}>
                <Ionicons name="ellipsis-vertical" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: 'white' }}>

        {/* WhatsApp Style Tabs */}
        <View style={styles.tabs}>
          {(["Home", "Patients", "Reminders"] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "Reminders" && (
          <View style={styles.calendarContainer}>
            <Calendar
              current={selectedDate}
              onDayPress={(day: any) => setSelectedDate(day.dateString)}
              markedDates={markedDates}
              theme={{
                todayTextColor: '#EA580C',
                todayButtonFontWeight: 'bold',
                arrowColor: '#EA580C',
                indicatorColor: '#EA580C',
                selectedDayBackgroundColor: '#EA580C',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textMonthFontWeight: 'bold',
              }}
            />
            <View style={styles.dateHeader}>
              <Text style={styles.dateHeaderText}>Patients for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</Text>
            </View>
          </View>
        )}

        {loading && activeTab !== "Home" ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#0284C7" />
          </View>
        ) : activeTab === "Home" ? (
          renderHome()
        ) : (
          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="folder-open-outline" size={80} color="#CBD5E1" />
                <Text style={styles.emptyText}>No {activeTab.toLowerCase()} found.</Text>
              </View>
            }
          />
        )}

        {/* Dynamic Floating Action Button - Hidden on Home */}
        {activeTab !== "Home" && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => {
              if (activeTab === "Patients") router.push("/add-patient");
              else if (activeTab === "Reminders") router.push("/add-followup");
            }}
          >
            <Ionicons name="add" size={30} color="white" />
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  header: { backgroundColor: "#0284C7", paddingHorizontal: 15, paddingTop: 15, paddingBottom: 5, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerBrand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoBadge: { width: 32, height: 32, borderRadius: 8, backgroundColor: "white", justifyContent: "center", alignItems: "center" },
  headerTitle: { color: "white", fontSize: 20, fontWeight: "700", letterSpacing: -0.5 },
  searchBar: { flex: 1, flexDirection: "row", alignItems: "center", gap: 15, height: 45 },
  searchInput: { flex: 1, color: "white", fontSize: 18, fontWeight: "500" },
  headerIcons: { flexDirection: "row" },
  headerBtn: { padding: 8, marginLeft: 5 },
  tabs: { backgroundColor: "#0284C7", flexDirection: "row", paddingTop: 5 },
  tab: { flex: 1, paddingVertical: 15, alignItems: "center", borderBottomWidth: 3, borderBottomColor: "transparent" },
  activeTab: { borderBottomColor: "white" },
  tabText: { color: "rgba(255,255,255,0.7)", fontWeight: "700", fontSize: 13 },
  activeTabText: { color: "white" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 },
  listItem: { flexDirection: "row", paddingHorizontal: 15, paddingVertical: 12, alignItems: "center" },
  itemContent: { flex: 1, borderBottomWidth: 0.5, borderBottomColor: "#E2E8F0", paddingBottom: 12 },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  itemName: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  itemSub: { fontSize: 14, color: "#64748B", marginTop: 2 },
  itemAddress: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  ageTag: { fontSize: 11, fontWeight: "700", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  avatarCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", marginRight: 15 },
  itemSubtext: { fontSize: 14, color: "#64748B" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  emptyText: { color: "#94A3B8", fontSize: 16, fontWeight: "600" },
  fab: { position: "absolute", bottom: 25, right: 25, backgroundColor: "#059669", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", elevation: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  calendarContainer: { backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  dateHeader: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#F8FAFC", borderTopWidth: 1, borderTopColor: "#E2E8F0" },
  dateHeaderText: { fontSize: 14, fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 },
  homeContainer: { flex: 1, padding: 20 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 15 },
  statCard: { width: (width - 55) / 2, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  statIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  statValue: { fontSize: 24, fontWeight: "700", color: "#1E293B" },
  statLabel: { fontSize: 12, color: "#64748B", marginTop: 2 },
  chartSection: { marginTop: 25, backgroundColor: "white", padding: 15, borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1E293B", marginBottom: 15 },
  quickActions: { marginTop: 25 },
  actionRow: { flexDirection: "row", gap: 12 },
  actionBtn: { flex: 1, backgroundColor: "white", padding: 15, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0", gap: 8 },
  actionText: { fontSize: 12, fontWeight: "600", color: "#475569" },
  onboardingCard: { backgroundColor: "white", padding: 15, borderRadius: 20, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 25 },
  onboardingHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 5 },
  onboardingTitle: { fontSize: 16, fontWeight: "800", color: "#1E293B" },
  onboardingSub: { fontSize: 12, color: "#64748B", marginBottom: 15 },
  onboardingActions: { flexDirection: "row", gap: 10 },
  onboardingBtn: { flex: 1, flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, gap: 10 },
  onboardingIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  onboardingBtnText: { color: "white", fontSize: 13, fontWeight: "700" },
  onboardingBtnSub: { color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: "500" },
});
