import React, { useState, useEffect } from "react";
import { 
  Text, 
  View, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  Image
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../styles/Theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Config } from "../Config";

const API_BASE = Config.API_BASE;
const API_KEY = Config.API_KEY;

export default function ClinicProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    clinic_name: "",
    clinic_address: "",
    clinic_phone: "",
    clinic_email: "",
    whatsapp_header_image: ""
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}?action=get_app_settings`, {
        headers: { "X-API-KEY": API_KEY }
      });
      const json = await response.json();
      if (json.success) {
        setSettings(prev => ({ ...prev, ...json.data }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}?action=save_app_settings`, {
        method: "POST",
        headers: { 
          "X-API-KEY": API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(settings)
      });
      const json = await response.json();
      if (json.success) {
        Alert.alert("Success", "Clinic profile updated!");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Theme.colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Clinic Profile" }} />
      
      <ScrollView style={styles.content}>
        <View style={styles.coverSection}>
          {settings.whatsapp_header_image ? (
            <Image source={{ uri: settings.whatsapp_header_image }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverImage, { backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="image-outline" size={40} color="#94A3B8" />
              <Text style={{ color: '#94A3B8', marginTop: 10 }}>No Cover Photo</Text>
            </View>
          )}
          <View style={styles.logoOverlay}>
            <View style={styles.logoBox}>
              <Ionicons name="business" size={32} color={Theme.colors.primary} />
            </View>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionHeader}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Clinic Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="business-outline" size={20} color="#64748B" />
              <TextInput 
                style={styles.input} 
                value={settings.clinic_name}
                onChangeText={(t) => setSettings({...settings, clinic_name: t})}
                placeholder="Hospital/Clinic Name"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color="#64748B" />
              <TextInput 
                style={styles.input} 
                value={settings.clinic_phone}
                onChangeText={(t) => setSettings({...settings, clinic_phone: t})}
                placeholder="Official Phone"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#64748B" />
              <TextInput 
                style={styles.input} 
                value={settings.clinic_email}
                onChangeText={(t) => setSettings({...settings, clinic_email: t})}
                placeholder="Official Email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={20} color="#64748B" />
              <TextInput 
                style={styles.input} 
                value={settings.clinic_address}
                onChangeText={(t) => setSettings({...settings, clinic_address: t})}
                placeholder="Street, City, Zip"
                multiline
              />
            </View>
          </View>

          <Text style={[styles.sectionHeader, { marginTop: 25 }]}>Branding & Assets</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Profile/Cover Photo URL</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="link-outline" size={20} color="#64748B" />
              <TextInput 
                style={styles.input} 
                value={settings.whatsapp_header_image}
                onChangeText={(t) => setSettings({...settings, whatsapp_header_image: t})}
                placeholder="https://yourlink.com/logo.png"
              />
            </View>
            <Text style={styles.hint}>This image will be sent as the header in your WhatsApp templates.</Text>
          </View>

          <TouchableOpacity 
            style={[styles.saveBtn, saving && styles.disabledBtn]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
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
  coverSection: { height: 180, width: '100%', position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  logoOverlay: { position: 'absolute', bottom: -30, left: 20 },
  logoBox: { width: 80, height: 80, borderRadius: 20, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  
  form: { padding: 20, paddingTop: 50 },
  sectionHeader: { fontSize: 16, fontWeight: "800", color: "#1E293B", marginBottom: 15 },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: "700", color: "#64748B", textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 14, paddingHorizontal: 15, borderWidth: 1, borderColor: "#E2E8F0" },
  input: { flex: 1, paddingVertical: 14, paddingHorizontal: 10, fontSize: 15, color: "#1E293B" },
  
  hint: { fontSize: 11, color: "#94A3B8", marginTop: 6, fontStyle: 'italic' },
  saveBtn: { backgroundColor: Theme.colors.primary, paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 20, elevation: 4 },
  disabledBtn: { backgroundColor: "#94A3B8" },
  saveBtnText: { color: "white", fontSize: 18, fontWeight: "800" },
});
