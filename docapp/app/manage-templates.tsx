import React, { useState, useEffect, useCallback } from "react";
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
import { useRouter, Stack, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Config } from "../Config";

const API_BASE = Config.API_BASE;
const API_KEY = Config.API_KEY;

export default function ManageTemplates() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}?action=get_templates`, {
        headers: { "X-API-KEY": API_KEY }
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
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const deleteTemplate = (id: number) => {
    Alert.alert("Delete Template", "Are you sure you want to remove this message template?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        const response = await fetch(`${API_BASE}?action=delete_template&id=${id}`, {
          headers: { "X-API-KEY": API_KEY }
        });
        const json = await response.json();
        if (json.success) fetchData();
      }}
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.listItem}
      onPress={() => router.push({ pathname: "/template/[id]", params: { id: item.id } })}
    >
      <View style={[styles.avatar, { backgroundColor: "#F0F9FF" }]}>
        <Ionicons 
          name={item.content_type === "Text" ? "chatbubble-ellipses" : (item.content_type === "Image" ? "image" : "videocam")} 
          size={24} 
          color="#0284C7" 
        />
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: 'wrap' }}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.aoc_template_name && (
                <View style={styles.aocBadge}>
                  <Ionicons name="flash" size={10} color="#F59E0B" />
                  <Text style={styles.aocBadgeText}>{item.aoc_template_name}</Text>
                </View>
              )}
              {(item.is_default === "1" || item.is_default === 1) && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                </View>
              )}
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <TouchableOpacity onPress={() => router.push({ pathname: "/add-template", params: { id: item.id } })}>
              <Ionicons name="create-outline" size={20} color="#0284C7" />
            </TouchableOpacity>
            {(!item.aoc_template_name || item.id > 2) && (
              <TouchableOpacity onPress={() => deleteTemplate(item.id)}>
                <Ionicons name="trash-outline" size={20} color="#E11D48" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text style={styles.itemSubtext} numberOfLines={1}>{item.content_part1}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Saved Messages" }} />
      
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
          ListEmptyComponent={<View style={styles.center}><Text>No templates found.</Text></View>}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => router.push("/add-template")}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 50 },
  list: { paddingVertical: 10 },
  listItem: { flexDirection: "row", paddingHorizontal: 15, paddingVertical: 12, alignItems: "center" },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", marginRight: 15 },
  itemContent: { flex: 1, borderBottomWidth: 0.5, borderBottomColor: "#E2E8F0", paddingBottom: 12 },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemName: { fontSize: 16, fontWeight: "600", color: "#1E293B" },
  itemSubtext: { fontSize: 13, color: "#64748B", marginTop: 4 },
  fab: { position: "absolute", bottom: 30, right: 30, backgroundColor: "#0284C7", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", elevation: 5 },
  defaultBadge: { backgroundColor: "#ECFDF5", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: "#10B981" },
  defaultBadgeText: { fontSize: 10, fontWeight: "800", color: "#059669" },
  aocBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: "#FFFBEB", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: "#F59E0B", gap: 2 },
  aocBadgeText: { fontSize: 10, fontWeight: "800", color: "#D97706" },
});
