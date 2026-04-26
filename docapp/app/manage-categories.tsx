import React, { useState, useEffect } from "react";
import { 
  Text, 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Config } from "../Config";

const API_BASE = Config.API_BASE;
const API_KEY = Config.API_KEY;

export default function ManageCategories() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTokenAndFetch();
  }, []);

  const loadTokenAndFetch = async () => {
    const t = await AsyncStorage.getItem("userToken");
    if (t) {
        fetchData(t);
    } else {
        router.replace("/login");
    }
  };

  const fetchData = async (t?: string) => {
    try {
      const activeToken = t || await AsyncStorage.getItem("userToken");
      if (!activeToken) return;

      const response = await fetch(`${API_BASE}?action=get_categories`, {
        headers: { 
            "X-API-KEY": API_KEY,
            "X-TOKEN": activeToken
        }
      });
      const json = await response.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const deleteCategory = (id: number) => {
    Alert.alert("Delete Category", "Are you sure? Patients in this category will not be deleted, but the grouping will be removed.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        const t = await AsyncStorage.getItem("userToken");
        const response = await fetch(`${API_BASE}?action=delete_category&id=${id}`, {
          headers: { 
              "X-API-KEY": API_KEY,
              "X-TOKEN": t || ""
          }
        });
        const json = await response.json();
        if (json.success) fetchData();
      }}
    ]);
  };

  const handleLongPress = (item: any) => {
    Alert.alert(
      item.name,
      "Manage this category",
      [
        {
          text: "View Patients",
          onPress: () => router.push({ pathname: `/category/${item.id}`, params: { name: item.name } })
        },
        {
          text: "Edit Category Name",
          onPress: () => router.push({ pathname: "/add-category", params: { id: item.id, name: item.name } })
        },
        {
          text: "Delete Group",
          style: "destructive",
          onPress: () => deleteCategory(item.id)
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.listItem}
      onPress={() => router.push({ pathname: `/category/${item.id}`, params: { name: item.name } })}
      onLongPress={() => handleLongPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: "#F0F9FF" }]}>
        <Ionicons name="layers" size={22} color="#0284C7" />
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{item.patient_count || 0}</Text>
          </View>
        </View>
        <Text style={styles.itemSubtext}>Tap to view list • Long press to manage</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Manage Categories" }} />
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0284C7" />
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchData();}} />}
          ListEmptyComponent={<View style={styles.center}><Text>No categories found.</Text></View>}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => router.push("/add-category")}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 50 },
  list: { paddingVertical: 10 },
  listItem: { flexDirection: "row", paddingHorizontal: 20, paddingVertical: 18, alignItems: "center", backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  avatar: { width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 15 },
  itemContent: { flex: 1 },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemName: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  countBadge: { backgroundColor: "#F0F9FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  countText: { fontSize: 12, fontWeight: "800", color: "#0284C7" },
  itemSubtext: { fontSize: 12, color: "#64748B", marginTop: 4 },
  fab: { position: "absolute", bottom: 30, right: 30, backgroundColor: "#0284C7", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", elevation: 8, shadowColor: "#0284C7", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
});
