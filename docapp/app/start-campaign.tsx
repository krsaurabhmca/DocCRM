import React, { useState, useEffect } from "react";
import { 
  Text, 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  StatusBar
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../styles/Theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Config } from "../Config";

const { width } = Dimensions.get("window");

export default function StartCampaign() {
  const router = useRouter();
  const { templateId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [patientCount, setPatientCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catRes, tempRes] = await Promise.all([
        fetch(`${Config.API_BASE}?action=get_categories`, { headers: { "X-API-KEY": Config.API_KEY } }),
        fetch(`${Config.API_BASE}?action=get_templates`, { headers: { "X-API-KEY": Config.API_KEY } })
      ]);
      
      const catJson = await catRes.json();
      const tempJson = await tempRes.json();
      
      if (catJson.success) setCategories(catJson.data);
      if (tempJson.success) {
        setTemplates(tempJson.data);
        if (templateId) {
          const preSelected = tempJson.data.find((t: any) => t.id.toString() === templateId.toString());
          if (preSelected) setSelectedTemplate(preSelected);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCategoryIds.length > 0) {
      fetchPatientCount();
    } else {
      setPatientCount(0);
    }
  }, [selectedCategoryIds]);

  const fetchPatientCount = async () => {
    try {
      const ids = selectedCategoryIds.join(",");
      const res = await fetch(`${Config.API_BASE}?action=get_campaign_reach&category_ids=${ids}`, {
        headers: { "X-API-KEY": Config.API_KEY }
      });
      const json = await res.json();
      if (json.success) setPatientCount(json.count);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleCategory = (id: number) => {
    if (selectedCategoryIds.includes(id)) {
      setSelectedCategoryIds(selectedCategoryIds.filter(i => i !== id));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, id]);
    }
  };

  const handleLaunch = async () => {
    if (selectedCategoryIds.length === 0 || !selectedTemplate) {
      Alert.alert("Selection Required", "Please select at least one target group and exactly one message template.");
      return;
    }

    Alert.alert(
      "🚀 Confirm Campaign",
      `Are you sure you want to launch this campaign to ${patientCount} patients?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Launch Now", style: "default", onPress: launchNow }
      ]
    );
  };

  const launchNow = async () => {
    setLaunching(true);
    try {
      const formData = new FormData();
      formData.append('category_ids', selectedCategoryIds.join(","));
      formData.append('template_id', selectedTemplate.id.toString());

      const response = await fetch(`${Config.API_BASE}?action=start_campaign`, {
        method: 'POST',
        headers: { "X-API-KEY": Config.API_KEY },
        body: formData
      });
      
      const json = await response.json();
      if (json.success) {
        Alert.alert("Campaign Successful!", json.message, [
          { text: "Done", onPress: () => router.back() }
        ]);
      } else {
        Alert.alert("Launch Failed", json.message);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Check your connection.");
    } finally {
      setLaunching(false);
    }
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Theme.colors.primary} />
      <Text style={styles.loadingText}>Syncing Campaigns...</Text>
    </View>
  );

  if (categories.length === 0) return (
    <View style={styles.center}>
      <View style={styles.emptyIconBox}>
        <Ionicons name="megaphone-outline" size={60} color="#CBD5E1" />
      </View>
      <Text style={styles.emptyTitle}>No Target Groups Found</Text>
      <Text style={styles.emptySub}>Please create patient categories first to start a campaign.</Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push("/manage-categories")}>
        <Text style={styles.emptyBtnText}>Setup Categories</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ 
        title: "Bulk Campaign Pro", 
        headerStyle: { backgroundColor: Theme.colors.primary },
        headerTintColor: 'white'
      }} />
      
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Dynamic Reach Dashboard */}
        <View style={styles.dashboard}>
          <View style={styles.statsCard}>
            <View style={styles.reachBadge}>
              <Ionicons name="pulse" size={14} color="white" />
              <Text style={styles.reachBadgeText}>LIVE REACH</Text>
            </View>
            <Text style={styles.statsValue}>{patientCount}</Text>
            <Text style={styles.statsSub}>Unique Patients Selected</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Step 1: Target Selection */}
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
            <Text style={styles.stepTitle}>Select Audience Groups</Text>
          </View>

          <View style={styles.chipGrid}>
            {categories.map((cat) => {
              const isActive = selectedCategoryIds.includes(cat.id);
              return (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => toggleCategory(cat.id)}
                >
                  <View style={[styles.chipIconBox, { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#F1F5F9' }]}>
                    <Ionicons 
                      name={isActive ? "checkmark" : "add"} 
                      size={14} 
                      color={isActive ? "white" : "#64748B"} 
                    />
                  </View>
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {/* Step 2: Template Selection */}
          <View style={[styles.stepHeader, { marginTop: 35 }]}>
            <View style={[styles.stepNumber, { backgroundColor: '#8B5CF6' }]}><Text style={styles.stepNumberText}>2</Text></View>
            <Text style={styles.stepTitle}>Message Details</Text>
          </View>

          {!selectedTemplate ? (
            <View style={styles.templateList}>
              {templates.map((temp) => (
                <TouchableOpacity 
                  key={temp.id} 
                  style={styles.templatePickerItem}
                  onPress={() => setSelectedTemplate(temp)}
                >
                  <View style={styles.tempPickerIcon}>
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="#8B5CF6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.templatePickerName}>{temp.name}</Text>
                    <Text style={styles.templatePickerSub} numberOfLines={1}>{temp.content_part1}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.selectedTemplateCard}>
              <View style={styles.selectedTemplateHeader}>
                <View style={styles.selectedTemplateInfo}>
                  <Ionicons name="checkmark-circle" size={24} color="#059669" />
                  <View>
                    <Text style={styles.selectedTemplateLabel}>SELECTED MESSAGE</Text>
                    <Text style={styles.selectedTemplateName}>{selectedTemplate.name}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.changeBtn} 
                  onPress={() => setSelectedTemplate(null)}
                >
                  <Text style={styles.changeBtnText}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 3: Simulation */}
          {selectedTemplate && (
            <View style={styles.fullPreviewSection}>
              <View style={[styles.stepHeader, { marginTop: 35 }]}>
                <View style={[styles.stepNumber, { backgroundColor: '#10B981' }]}><Text style={styles.stepNumberText}>3</Text></View>
                <Text style={styles.stepTitle}>Delivery Preview</Text>
              </View>
              
              <View style={styles.simulationWindow}>
                <View style={styles.whatsappBubble}>
                  {selectedTemplate.media_url ? (
                    <Image 
                      source={{ uri: `${Config.API_BASE.replace('api/index.php', '')}${selectedTemplate.media_url}` }} 
                      style={styles.bubbleImage} 
                    />
                  ) : null}
                  <View style={styles.bubbleContent}>
                    <Text style={styles.bubblePart1}>
                      {selectedTemplate.content_part1.replace(/#Patient Name#/g, "Sanjay Kumar")}
                    </Text>
                    <Text style={styles.bubblePart2}>{selectedTemplate.content_part2}</Text>
                    {selectedTemplate.content_part3 ? (
                      <Text style={styles.bubblePart3}>{selectedTemplate.content_part3}</Text>
                    ) : null}
                    
                    <View style={styles.bubbleFooter}>
                      <Text style={styles.bubbleTime}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                      <Ionicons name="checkmark-done" size={16} color="#4FC3F7" />
                    </View>
                  </View>
                </View>
                <Text style={styles.previewNote}>* Above is a simulation of the actual message.</Text>
              </View>
            </View>
          )}
        </View>

        {/* Global Action Area */}
        <View style={styles.actionArea}>
          <TouchableOpacity 
            style={[styles.launchBtn, (launching || selectedCategoryIds.length === 0 || !selectedTemplate) && styles.disabledBtn]} 
            onPress={handleLaunch}
            disabled={launching || selectedCategoryIds.length === 0 || !selectedTemplate}
          >
            {launching ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={22} color="white" />
                <Text style={styles.launchBtnText}>Deploy Campaign Now</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.disclaimer}>Encrypted Delivery • Personal Variable Injection</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  loadingText: { marginTop: 15, fontSize: 14, fontWeight: '700', color: '#64748B' },
  
  emptyIconBox: { width: 100, height: 100, borderRadius: 30, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  emptySub: { textAlign: 'center', color: '#64748B', marginTop: 10, lineHeight: 20 },
  emptyBtn: { backgroundColor: Theme.colors.primary, paddingVertical: 15, paddingHorizontal: 30, borderRadius: 15, marginTop: 25 },
  emptyBtnText: { color: 'white', fontWeight: '800' },

  dashboard: { padding: 30, backgroundColor: Theme.colors.primary, borderBottomLeftRadius: 50, borderBottomRightRadius: 50, elevation: 15, shadowColor: Theme.colors.primary, shadowOpacity: 0.3, shadowRadius: 15 },
  statsCard: { alignItems: 'center' },
  reachBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20, marginBottom: 5 },
  reachBadgeText: { color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  statsValue: { color: 'white', fontSize: 64, fontWeight: '900' },
  statsSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },

  content: { padding: 25 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#0284C7', justifyContent: 'center', alignItems: 'center' },
  stepNumberText: { color: 'white', fontSize: 14, fontWeight: '900' },
  stepTitle: { fontSize: 17, fontWeight: "900", color: "#1E293B" },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 16, backgroundColor: 'white', borderWidth: 1, borderColor: '#E2E8F0' },
  chipActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary, elevation: 5 },
  chipIconBox: { width: 22, height: 22, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  chipText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  chipTextActive: { color: 'white' },

  templateList: { gap: 10 },
  templatePickerItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', gap: 15 },
  tempPickerIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center' },
  templatePickerName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  templatePickerSub: { fontSize: 12, color: '#64748B', marginTop: 2 },

  selectedTemplateCard: { backgroundColor: '#F0FDF4', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: '#DCFCE7' },
  selectedTemplateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectedTemplateInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectedTemplateLabel: { fontSize: 9, fontWeight: '800', color: '#059669', letterSpacing: 0.5 },
  selectedTemplateName: { fontSize: 16, fontWeight: '700', color: '#064E3B' },
  changeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'white', borderWidth: 1, borderColor: '#DCFCE7' },
  changeBtnText: { fontSize: 12, fontWeight: '700', color: '#059669' },

  fullPreviewSection: { marginTop: 0 },
  simulationWindow: { padding: 15, backgroundColor: '#E5DDD5', borderRadius: 25, marginTop: 5 },
  whatsappBubble: { backgroundColor: 'white', borderRadius: 12, alignSelf: 'flex-start', maxWidth: '100%', elevation: 2, overflow: 'hidden' },
  bubbleImage: { width: width - 80, height: (width - 80) * 0.5, backgroundColor: '#F1F5F9' },
  bubbleContent: { padding: 10 },
  bubblePart1: { color: '#1E293B', fontSize: 14, fontWeight: '600' },
  bubblePart2: { color: '#1E293B', fontSize: 14, marginTop: 8 },
  bubblePart3: { color: '#64748B', fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  bubbleFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 5 },
  bubbleTime: { fontSize: 10, color: '#667781' },
  previewNote: { fontSize: 10, color: '#64748B', textAlign: 'center', marginTop: 10, fontStyle: 'italic' },

  actionArea: { padding: 25, alignItems: 'center' },
  launchBtn: { backgroundColor: Theme.colors.primary, width: "100%", flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 20, borderRadius: 25, elevation: 12, gap: 12 },
  disabledBtn: { backgroundColor: "#CBD5E1", elevation: 0 },
  launchBtnText: { color: "white", fontSize: 20, fontWeight: "900" },
  disclaimer: { fontSize: 11, color: "#94A3B8", marginTop: 15, fontWeight: '600' }
});
