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
  Image,
  Share
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../styles/Theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Config } from "../Config";
import * as ImagePicker from 'expo-image-picker';

const API_BASE = Config.API_BASE;
const API_KEY = Config.API_KEY;

export default function ClinicProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  
  const [settings, setSettings] = useState({
    clinic_name: "",
    clinic_address: "",
    clinic_phone: "",
    clinic_email: "",
    clinic_timings: "",
    clinic_logo: "",
    clinic_cover: "",
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

  const pickImage = async (type: 'logo' | 'cover' | 'whatsapp') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadFile(result.assets[0].uri, type);
    }
  };

  const uploadFile = async (uri: string, type: string) => {
    setUploading(type);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const fileType = match ? `image/${match[1]}` : `image`;

      formData.append('image', {
        uri,
        name: filename,
        type: fileType,
      } as any);

      const response = await fetch(`${API_BASE}?action=upload_image`, {
        method: 'POST',
        body: formData,
        headers: {
          'X-API-KEY': API_KEY,
        },
      });

      const json = await response.json();
      if (json.success) {
        if (type === 'logo') setSettings({ ...settings, clinic_logo: json.url });
        else if (type === 'cover') setSettings({ ...settings, clinic_cover: json.url });
        else if (type === 'whatsapp') setSettings({ ...settings, whatsapp_header_image: json.url });
      } else {
        Alert.alert("Upload Failed", json.message);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Network error during upload.");
    } finally {
      setUploading(null);
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
        Alert.alert("Success", "Branding & Profile updated!");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    const message = `🏥 *${settings.clinic_name || "Our Clinic"}*\n📍 ${settings.clinic_address || "Visit us today"}\n📞 Contact: ${settings.clinic_phone || "N/A"}\n📧 Email: ${settings.clinic_email || "N/A"}\n\nThank you for choosing us!`;
    try {
      await Share.share({ message });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Theme.colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: "Clinic Profile & Branding",
        headerRight: () => (
          <TouchableOpacity onPress={() => router.push("/clinic-card")} style={{ marginRight: 15 }}>
            <Ionicons name="share-social-outline" size={24} color="white" />
          </TouchableOpacity>
        )
      }} />
      
      <ScrollView style={styles.content}>
        {/* Branding Preview */}
        <View style={styles.brandingHeader}>
          <TouchableOpacity style={styles.coverSection} onPress={() => pickImage('cover')}>
            {settings.clinic_cover ? (
              <Image source={{ uri: settings.clinic_cover }} style={styles.coverImage} />
            ) : (
              <View style={[styles.coverImage, { backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="image-outline" size={40} color="#94A3B8" />
                <Text style={{ color: '#94A3B8', marginTop: 10 }}>Tap to upload Cover</Text>
              </View>
            )}
            {uploading === 'cover' && (
              <View style={styles.uploadingOverlay}><ActivityIndicator color="white" /></View>
            )}
            <View style={styles.editBadge}><Ionicons name="camera" size={16} color="white" /></View>
          </TouchableOpacity>
          
          <View style={styles.logoPosition}>
            <TouchableOpacity style={styles.logoBox} onPress={() => pickImage('logo')}>
              {settings.clinic_logo ? (
                <Image source={{ uri: settings.clinic_logo }} style={styles.logoImage} />
              ) : (
                <Ionicons name="business" size={32} color={Theme.colors.primary} />
              )}
              {uploading === 'logo' && (
                <View style={styles.uploadingOverlay}><ActivityIndicator color="white" /></View>
              )}
              <View style={styles.editBadgeMini}><Ionicons name="camera" size={12} color="white" /></View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionHeader}>Clinic Identity</Text>
          
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

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputWrapper}>
                <TextInput 
                  style={styles.input} 
                  value={settings.clinic_phone}
                  onChangeText={(t) => setSettings({...settings, clinic_phone: t})}
                  placeholder="+91..."
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <TextInput 
                  style={styles.input} 
                  value={settings.clinic_email}
                  onChangeText={(t) => setSettings({...settings, clinic_email: t})}
                  placeholder="clinic@mail.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Working Hours / Timings</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="time-outline" size={20} color="#64748B" />
              <TextInput 
                style={styles.input} 
                value={settings.clinic_timings}
                onChangeText={(t) => setSettings({...settings, clinic_timings: t})}
                placeholder="e.g. 10:00 AM - 08:00 PM"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Clinic Address</Text>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={[styles.input, { textAlignVertical: 'top' }]} 
                value={settings.clinic_address}
                onChangeText={(t) => setSettings({...settings, clinic_address: t})}
                placeholder="Full clinical address..."
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <Text style={[styles.sectionHeader, { marginTop: 20 }]}>Messaging Branding</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>WhatsApp Default Header</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage('whatsapp')}>
              <Ionicons name="cloud-upload-outline" size={20} color={Theme.colors.primary} />
              <Text style={styles.uploadBtnText}>Upload New Header Image</Text>
              {uploading === 'whatsapp' && <ActivityIndicator size="small" color={Theme.colors.primary} />}
            </TouchableOpacity>
            {settings.whatsapp_header_image && (
              <Text style={styles.hint} numberOfLines={1}>Current: {settings.whatsapp_header_image}</Text>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.saveBtn, saving && styles.disabledBtn]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save All Changes</Text>}
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
  
  brandingHeader: { position: 'relative', marginBottom: 40 },
  coverSection: { height: 170, width: '100%', overflow: 'hidden', position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  uploadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  editBadge: { position: 'absolute', right: 15, bottom: 15, backgroundColor: Theme.colors.primary, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWeight: 2, borderColor: 'white' },
  
  logoPosition: { position: 'absolute', bottom: -35, left: 25 },
  logoBox: { width: 90, height: 90, borderRadius: 24, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10, borderWidth: 3, borderColor: 'white', overflow: 'hidden' },
  logoImage: { width: '100%', height: '100%' },
  editBadgeMini: { position: 'absolute', right: 5, bottom: 5, backgroundColor: Theme.colors.primary, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWeight: 1, borderColor: 'white' },

  form: { padding: 25 },
  row: { flexDirection: 'row' },
  sectionHeader: { fontSize: 15, fontWeight: "800", color: "#64748B", marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: "700", color: "#475569", marginBottom: 8 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 16, paddingHorizontal: 15, borderWidth: 1, borderColor: "#E2E8F0" },
  input: { flex: 1, paddingVertical: 14, paddingHorizontal: 10, fontSize: 15, color: "#1E293B" },
  
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'white', padding: 15, borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, borderColor: Theme.colors.primary + '40' },
  uploadBtnText: { color: Theme.colors.primary, fontWeight: '700', fontSize: 14 },
  
  hint: { fontSize: 10, color: "#94A3B8", marginTop: 6, fontStyle: 'italic' },
  saveBtn: { backgroundColor: Theme.colors.primary, paddingVertical: 18, borderRadius: 18, alignItems: 'center', marginTop: 15, elevation: 6 },
  disabledBtn: { backgroundColor: "#94A3B8" },
  saveBtnText: { color: "white", fontSize: 18, fontWeight: "800" },
});
