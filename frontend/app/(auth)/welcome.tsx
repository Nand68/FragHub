import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const ACCENT = '#C8F135';
const BG = '#080C14';
const SURFACE = '#0F1521';
const BORDER = '#1C2535';
const TEXT_PRIMARY = '#F0F4FF';
const TEXT_MUTED = '#5A6A82';

const { width, height } = Dimensions.get('window');

// Decorative floating stat card
function StatCard({
  icon,
  value,
  label,
  delay,
  style,
}: {
  icon: string;
  value: string;
  label: string;
  delay: number;
  style?: any;
}) {
  const floatY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -6, duration: 2000 + delay * 0.3, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 2000 + delay * 0.3, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.statCard, style, { opacity, transform: [{ translateY: floatY }] }]}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon as any} size={13} color={ACCENT} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

// Animated grid dot
function GridDots() {
  const cols = 8;
  const rows = 10;
  return (
    <View style={styles.gridDots} pointerEvents="none">
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <View
            key={`${r}-${c}`}
            style={[
              styles.gridDot,
              {
                left: (c / (cols - 1)) * (width - 48) + 24,
                top: (r / (rows - 1)) * (height * 0.55),
                opacity: Math.random() * 0.25 + 0.05,
              },
            ]}
          />
        ))
      )}
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();

  // Staggered entrance animations
  const logoAnim = useRef(new Animated.Value(0)).current;
  const heroAnim = useRef(new Animated.Value(0)).current;
  const subAnim = useRef(new Animated.Value(0)).current;
  const tagsAnim = useRef(new Animated.Value(0)).current;
  const btnsAnim = useRef(new Animated.Value(0)).current;
  const primaryScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(logoAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(heroAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(subAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(tagsAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(btnsAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const fadeUp = (anim: Animated.Value, offset = 24) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }) }],
  });

  const onPrimaryPressIn = () =>
    Animated.spring(primaryScale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const onPrimaryPressOut = () =>
    Animated.spring(primaryScale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  return (
    <View style={styles.root}>
      {/* Background layers */}
      <LinearGradient
        colors={['#0A1628', BG, BG]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <GridDots />

      {/* Glow orbs */}
      <View style={styles.glowTopRight} pointerEvents="none" />
      <View style={styles.glowBottomLeft} pointerEvents="none" />
      <View style={styles.glowAccentCenter} pointerEvents="none" />

      {/* Floating stat cards */}
      <StatCard icon="people" value="12k+" label="Players" delay={800} style={styles.cardTopLeft} />
      <StatCard icon="trophy" value="500+" label="Tournaments" delay={1000} style={styles.cardTopRight} />
      <StatCard icon="flash" value="Live" label="Matches" delay={1200} style={styles.cardMidRight} />

      {/* Diagonal accent stripe */}
      <View style={styles.accentStripe} pointerEvents="none" />

      <View style={styles.content}>
        {/* Top — logo */}
        <Animated.View style={[styles.logoRow, fadeUp(logoAnim, 16)]}>
          <View style={styles.logoMark}>
            <View style={styles.logoInner} />
          </View>
          <Text style={styles.logoText}>FRAGHUB</Text>
        </Animated.View>

        {/* Hero section */}
        <View style={styles.heroSection}>
          {/* Eyebrow badge */}
          <Animated.View style={[styles.badge, fadeUp(heroAnim, 20)]}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>COMPETITIVE ESPORTS SCOUTING</Text>
          </Animated.View>

          {/* Big headline */}
          <Animated.Text style={[styles.headline, fadeUp(heroAnim, 28)]}>
            Your next{'\n'}
            <Text style={styles.headlineAccent}>breakthrough</Text>
            {'\n'}starts here.
          </Animated.Text>

          {/* Subtitle */}
          <Animated.Text style={[styles.subtitle, fadeUp(subAnim, 20)]}>
            Connect elite players with top organizations through{' '}
            <Text style={{ color: TEXT_PRIMARY }}>focused, data-driven scouting.</Text>
          </Animated.Text>

          {/* Feature tags */}
          <Animated.View style={[styles.tagsRow, fadeUp(tagsAnim, 16)]}>
            {['Player Profiles', 'Live Scouts', 'Team Offers', 'Match Stats'].map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* CTA buttons */}
        <Animated.View style={[styles.actions, fadeUp(btnsAnim, 16)]}>
          {/* Primary */}
          <Animated.View style={{ transform: [{ scale: primaryScale }] }}>
            <Pressable
              onPress={() => router.push('/signup')}
              onPressIn={onPrimaryPressIn}
              onPressOut={onPrimaryPressOut}
            >
              <LinearGradient
                colors={['#C8F135', '#96B827']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryLabel}>Get started</Text>
                <View style={styles.primaryArrow}>
                  <Ionicons name="arrow-forward" size={16} color={ACCENT} />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Secondary */}
          <TouchableOpacity
            onPress={() => router.push('/login')}
            style={styles.secondaryButton}
            activeOpacity={0.7}
          >
            <Ionicons name="person-outline" size={15} color={TEXT_MUTED} style={{ marginRight: 8 }} />
            <Text style={styles.secondaryLabel}>I already have an account</Text>
          </TouchableOpacity>

          {/* Trust line */}
          <View style={styles.trustRow}>
            <View style={styles.trustAvatars}>
              {['#FF6B6B', '#60C8FF', '#C8F135', '#FFB347'].map((c, i) => (
                <View key={i} style={[styles.trustAvatar, { backgroundColor: c, marginLeft: i === 0 ? 0 : -8 }]} />
              ))}
            </View>
            <Text style={styles.trustText}>Join 12,000+ players already competing</Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // Grid dots
  gridDots: { position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.6 },
  gridDot: { position: 'absolute', width: 2, height: 2, borderRadius: 1, backgroundColor: ACCENT },

  // Glows
  glowTopRight: {
    position: 'absolute', top: -80, right: -60,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: ACCENT, opacity: 0.06,
  },
  glowBottomLeft: {
    position: 'absolute', bottom: -100, left: -80,
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: '#1A6EFF', opacity: 0.07,
  },
  glowAccentCenter: {
    position: 'absolute', top: height * 0.25, left: width * 0.1,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: ACCENT, opacity: 0.03,
  },

  // Diagonal stripe
  accentStripe: {
    position: 'absolute',
    top: height * 0.18,
    left: -40,
    width: width + 80,
    height: 1,
    backgroundColor: ACCENT,
    opacity: 0.06,
    transform: [{ rotate: '-8deg' }],
  },

  // Stat cards
  statCard: {
    position: 'absolute',
    backgroundColor: SURFACE,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
    minWidth: 80,
  },
  cardTopLeft: { top: height * 0.1, left: 20 },
  cardTopRight: { top: height * 0.06, right: 20 },
  cardMidRight: { top: height * 0.22, right: 24 },
  statIconWrap: {
    width: 24, height: 24, borderRadius: 8,
    backgroundColor: '#1C2C10', alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: { fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.3 },
  statLabel: { fontSize: 10, color: TEXT_MUTED, letterSpacing: 0.3 },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 48,
    justifyContent: 'space-between',
  },

  // Logo
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: ACCENT,
    alignItems: 'center', justifyContent: 'center',
  },
  logoInner: { width: 10, height: 10, borderRadius: 3, backgroundColor: BG },
  logoText: { color: TEXT_PRIMARY, fontSize: 16, fontWeight: '800', letterSpacing: 4 },

  // Hero
  heroSection: { marginTop: 'auto', paddingBottom: 8 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    alignSelf: 'flex-start',
    backgroundColor: '#1C2C10',
    borderWidth: 1, borderColor: '#2A3C10',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    marginBottom: 20,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT },
  badgeText: { fontSize: 9, color: ACCENT, fontWeight: '700', letterSpacing: 1.5 },

  headline: {
    fontSize: 46,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: -1.2,
    lineHeight: 52,
    marginBottom: 16,
  },
  headlineAccent: { color: ACCENT },

  subtitle: {
    fontSize: 15,
    color: TEXT_MUTED,
    lineHeight: 23,
    marginBottom: 20,
  },

  // Tags
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: 1.5, borderColor: BORDER,
  },
  tagText: { fontSize: 11, color: TEXT_MUTED, fontWeight: '600', letterSpacing: 0.3 },

  // Actions
  actions: { gap: 12, marginTop: 36 },

  // Primary button
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: { fontSize: 16, fontWeight: '800', color: '#080C14', letterSpacing: 0.3 },
  primaryArrow: {
    marginLeft: 10,
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Secondary button
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: SURFACE,
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  secondaryLabel: { fontSize: 15, fontWeight: '600', color: TEXT_MUTED },

  // Trust row
  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 4 },
  trustAvatars: { flexDirection: 'row', alignItems: 'center' },
  trustAvatar: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: BG },
  trustText: { fontSize: 11, color: TEXT_MUTED },
});