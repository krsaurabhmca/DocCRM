import React, { useState, useEffect } from "react";
import { 
  Text, 
  View, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Share,
  ActivityIndicator,
  Dimensions
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../styles/Theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Config } from "../Config";

const { width } = Dimensions.get("window");

export default function ClinicCard() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${Config.API_BASE}?action=get_app_settings`, {
        headers: { "X-API-KEY": Config.API_KEY }
      });
      const json = await response.json();
      if (json.success) {
        setSettings(json.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const workingDays = settings.working_days || "Monday - Saturday";
    const timings = settings.clinic_timings || "10:00 AM - 08:00 PM";
    
    // Include Image Link at top for Rich Preview on WhatsApp/Socials
    const imageLink = settings.clinic_cover ? `🖼️ View Our Clinic: ${settings.clinic_cover}\n\n` : "";
    
    const message = `${imageLink}🏥 *${settings.clinic_name || "Our Clinic"}*\n━━━━━━━━━━━━━━━━━━━━\n📍 *Address:* ${settings.clinic_address || "N/A"}\n📞 *Call:* ${settings.clinic_phone || "N/A"}\n📧 *Email:* ${settings.clinic_email || "N/A"}\n\n🕒 *Timings:* ${timings}\n📅 *Days:* ${workingDays}\n━━━━━━━━━━━━━━━━━━━━\n_Powered by DocCRM_`;
    
    try {
      await Share.share({ 
        title: settings.clinic_name,
        message: message 
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Theme.colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Clinic Digital Poster" }} />
      
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View style={styles.posterContainer}>
          {/* Main Poster Design */}
          <View style={styles.poster}>
            {/* Header / Cover */}
            <View style={styles.coverBox}>
              {settings.clinic_cover ? (
                <Image source={{ uri: settings.clinic_cover }} style={styles.coverImage} />
              ) : (
                <View style={[styles.coverImage, { backgroundColor: Theme.colors.primary }]} />
              )}
              <View style={styles.overlay} />
            </View>

            {/* Content Section */}
            <View style={styles.content}>
              <View style={styles.logoRow}>
                <View style={styles.logoBox}>
                  {settings.clinic_logo ? (
                    <Image source={{ uri: settings.clinic_logo }} style={styles.logoImage} />
                  ) : (
                    <Ionicons name="pulse" size={40} color={Theme.colors.primary} />
                  )}
                </View>
                <View style={styles.titleBox}>
                  <Text style={styles.clinicName}>{settings.clinic_name || "Clinic Name"}</Text>
                  <Text style={styles.tagline}>Excellence in Healthcare</Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <View style={styles.infoItem}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="location" size={18} color="white" />
                  </View>
                  <Text style={styles.infoText}>{settings.clinic_address || "No address provided"}</Text>
                </View>

                <View style={styles.infoItem}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="call" size={18} color="white" />
                  </View>
                  <Text style={styles.infoText}>{settings.clinic_phone || "No contact"}</Text>
                </View>

                <View style={styles.infoItem}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="time" size={18} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.timeValue}>{settings.clinic_timings || "10:00 AM - 08:00 PM"}</Text>
                    
                    {/* Granular Timings List */}
                    <View style={styles.granularTimings}>
                      {(settings.working_days || "").split(",").map((day: string) => {
                        const hours = JSON.parse(settings.working_hours || "{}");
                        const dayHours = hours[day];
                        if (!dayHours) return null;
                        return (
                          <View key={day} style={styles.dayTimingRow}>
                            <Text style={styles.dayTimingName}>{day.substring(0, 3)}</Text>
                            <Text style={styles.dayTimingVal}>{dayHours.open} - {dayHours.close}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.footer}>
                <View style={styles.qrPlaceholder}>
                  <Ionicons name="qr-code-outline" size={40} color="#E2E8F0" />
                </View>
                <View>
                  <Text style={styles.footerBrand}>DocCRM Digital Card</Text>
                  <Text style={styles.footerWeb}>{settings.clinic_email || "ask@doccrm.com"}</Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.hint}>This is your clinical digital signature. Share it with patients for easy contact.</Text>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-social" size={24} color="white" />
            <Text style={styles.shareBtnText}>Share Digital Poster</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  posterContainer: { padding: 20, alignItems: 'center' },
  
  poster: { 
    width: width - 40, 
    backgroundColor: 'white', 
    borderRadius: 35, 
    overflow: 'hidden', 
    elevation: 20,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    marginBottom: 30
  },
  
  coverBox: { height: 140, width: '100%', position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  
  content: { padding: 25 },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginTop: -60, marginBottom: 25 },
  logoBox: { width: 85, height: 85, borderRadius: 25, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 4, borderColor: 'white' },
  logoImage: { width: '100%', height: '100%', borderRadius: 22 },
  titleBox: { marginLeft: 15, flex: 1, paddingTop: 35 },
  clinicName: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  tagline: { fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 2 },
  
  infoSection: { gap: 20, marginTop: 10 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconCircle: { width: 36, height: 36, borderRadius: 12, backgroundColor: Theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  infoText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#475569', lineHeight: 20 },
  timeValue: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  granularTimings: { marginTop: 10, gap: 5 },
  dayTimingRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 4 },
  dayTimingName: { fontSize: 12, fontWeight: '700', color: '#64748B', width: 40 },
  dayTimingVal: { fontSize: 12, fontWeight: '600', color: Theme.colors.primary },
  
  footer: { 
    marginTop: 30, 
    paddingTop: 25, 
    borderTopWidth: 1, 
    borderTopColor: '#F1F5F9', 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 15 
  },
  qrPlaceholder: { width: 50, height: 50, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  footerBrand: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  footerWeb: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  
  hint: { textAlign: 'center', color: '#64748B', fontSize: 13, paddingHorizontal: 30, lineHeight: 20, marginBottom: 25 },
  shareBtn: { backgroundColor: Theme.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 20, gap: 12, elevation: 8 },
  shareBtnText: { color: 'white', fontSize: 18, fontWeight: '800' }
});
