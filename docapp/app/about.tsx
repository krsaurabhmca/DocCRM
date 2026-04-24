import React from "react";
import { 
  Text, 
  View, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Linking 
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../styles/Theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AboutApp() {
  const insets = useSafeAreaInsets();

  const handleContact = (type: 'call' | 'mail' | 'web') => {
    if (type === 'call') Linking.openURL('tel:+919431426600');
    else if (type === 'mail') Linking.openURL('mailto:ask@offerplant.com');
    else if (type === 'web') Linking.openURL('https://offerplant.com');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "About DocCRM" }} />
      
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Ionicons name="pulse" size={50} color="white" />
          </View>
          <Text style={styles.appName}>DocCRM Professional</Text>
          <Text style={styles.version}>Version 1.0.0 (Stable)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.description}>
            DocCRM is a high-performance clinical management ecosystem designed to streamline patient care and engagement. 
            Built with state-of-the-art technology, it empowers healthcare professionals with real-time queue management, 
            automated WhatsApp CRM, and comprehensive financial analytics.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Developed By</Text>
          <View style={styles.divider} />
          
          <Text style={styles.companyName}>OfferPlant Technologies Pvt. Ltd.</Text>
          <Text style={styles.companyAddress}>
            2nd Floor Godrej Building,{"\n"}
            Salempur Chapra Bihar 841301
          </Text>

          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.contactItem} onPress={() => handleContact('call')}>
              <View style={[styles.iconCircle, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="call" size={20} color="#15803D" />
              </View>
              <Text style={styles.contactLabel}>Call Support</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactItem} onPress={() => handleContact('mail')}>
              <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="mail" size={20} color="#1D4ED8" />
              </View>
              <Text style={styles.contactLabel}>Email Us</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactItem} onPress={() => handleContact('web')}>
              <View style={[styles.iconCircle, { backgroundColor: '#FAF5FF' }]}>
                <Ionicons name="globe" size={20} color="#7E22CE" />
              </View>
              <Text style={styles.contactLabel}>Website</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.featureGrid}>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={24} color={Theme.colors.primary} />
            <Text style={styles.featureTitle}>Secure Data</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="cloud-done" size={24} color={Theme.colors.success} />
            <Text style={styles.featureTitle}>Live Sync</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            <Text style={styles.featureTitle}>Auto CRM</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 OfferPlant Technologies. All Rights Reserved.</Text>
          <Text style={styles.madeIn}>Made with ❤️ for Doctors</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { padding: 40, alignItems: 'center', backgroundColor: 'white', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, elevation: 4 },
  logoBox: { width: 100, height: 100, borderRadius: 30, backgroundColor: Theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 8 },
  appName: { fontSize: 24, fontWeight: "900", color: "#1E293B" },
  version: { fontSize: 13, color: "#64748B", marginTop: 5, fontWeight: '600' },
  
  section: { padding: 25 },
  description: { fontSize: 15, lineHeight: 24, color: "#475569", textAlign: 'center', fontStyle: 'italic' },
  
  card: { backgroundColor: "white", margin: 20, padding: 25, borderRadius: 32, elevation: 2 },
  cardTitle: { fontSize: 14, fontWeight: "800", color: "#64748B", textTransform: 'uppercase', letterSpacing: 1 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
  companyName: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  companyAddress: { fontSize: 14, color: "#64748B", marginTop: 8, lineHeight: 22 },
  
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  contactItem: { alignItems: 'center', flex: 1 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  contactLabel: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  
  featureGrid: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 10 },
  featureItem: { backgroundColor: 'white', padding: 15, borderRadius: 20, alignItems: 'center', width: 100, elevation: 1 },
  featureTitle: { fontSize: 11, fontWeight: '700', color: '#64748B', marginTop: 8 },
  
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 12, color: "#94A3B8" },
  madeIn: { fontSize: 11, color: "#CBD5E1", marginTop: 5, fontWeight: '600' }
});
