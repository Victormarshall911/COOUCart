import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const { session } = useAuth();

  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const particles = useRef(
    Array.from({ length: 20 }, () => ({
      x: useRef(new Animated.Value(Math.random() * width)).current,
      y: useRef(new Animated.Value(Math.random() * height)).current,
      opacity: useRef(new Animated.Value(0)).current,
      scale: useRef(new Animated.Value(0)).current,
    }))
  ).current;

  useEffect(() => {
    startAnimations();

    // Cleanup listeners when screen unmounts
    return () => {
      particles.forEach(particle => {
        particle.y.removeAllListeners();
      });
    };
  }, []);

  const startAnimations = () => {
    // Background fade in
    Animated.timing(backgroundOpacity, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Particles animation with continuous floating
    particles.forEach((particle, index) => {
      let currentY = Math.random() * height;

      // Track live Y position safely
      particle.y.addListener(({ value }) => {
        currentY = value;
      });

      // Initial appearance
      Animated.sequence([
        Animated.delay(index * 30),
        Animated.parallel([
          Animated.timing(particle.opacity, {
            toValue: 0.8,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Continuous floating animation
      const floatAnimation = () => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(particle.y, {
              toValue: currentY - 20,
              duration: 2000 + Math.random() * 1000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(particle.y, {
              toValue: currentY + 20,
              duration: 2000 + Math.random() * 1000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        ).start();
      };

      setTimeout(floatAnimation, index * 100);
    });

    // Logo animation with pulse effect
    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1000,
          easing: Easing.elastic(1.5),
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Continuous logo pulse
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoScale, {
            toValue: 1.05,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 1600);

    // Text animation with staggered letters
    Animated.sequence([
      Animated.delay(1400),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Navigate after animations complete
    setTimeout(() => {
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/auth/login');
      }
    }, 4000);
  };

  const renderParticles = () => {
    return particles.map((particle, index) => (
      <Animated.View
        key={index}
        style={[
          styles.particle,
          {
            left: particle.x,
            top: particle.y,
            opacity: particle.opacity,
            transform: [{ scale: particle.scale }],
          },
        ]}
      />
    ));
  };

  return (
    <Animated.View style={[styles.container, { opacity: backgroundOpacity }]}>
      <LinearGradient
        colors={['#fafafa', '#f5f5f5', '#f0f0f0']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.5, 1]}
      >
        {/* Floating particles */}
        {renderParticles()}

        {/* Main content */}
        <View style={styles.content}>
          {/* Logo container with glow effect */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <View style={styles.logoGlow}>
              <View style={styles.logoInnerGlow}>
                <View style={styles.logoWrapper}>
                  <Animated.Image
                    source={require('@/assets/images/V.png')}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </View>
          </Animated.View>

          {/* App name with animation */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: textOpacity,
                transform: [{ translateY: textTranslateY }],
              },
            ]}
          >
            <Text style={styles.appName}>COOUCart</Text>
            <Text style={styles.tagline}>Your Campus Marketplace</Text>
            <View style={styles.loadingContainer}>
              <View style={styles.loadingDots}>
                <Animated.View style={[styles.dot, styles.dot1]} />
                <Animated.View style={[styles.dot, styles.dot2]} />
                <Animated.View style={[styles.dot, styles.dot3]} />
              </View>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          </Animated.View>
        </View>

        {/* Bottom decoration with waves */}
        <View style={styles.bottomDecoration}>
          <View style={styles.wave1} />
          <View style={styles.wave2} />
          <View style={styles.wave3} />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d6c529',
    shadowColor: '#d6c529',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoGlow: {
    shadowColor: '#d6c529',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  logoInnerGlow: {
    shadowColor: '#d6c529',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
  },
  logoWrapper: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#d6c529',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4a4a4a',
    textAlign: 'center',
    letterSpacing: 3,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 20,
    color: '#6a6a6a',
    textAlign: 'center',
    fontWeight: '300',
    letterSpacing: 1.5,
    marginBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#d6c529',
  },
  dot1: {
    opacity: 0.3,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 1,
  },
  loadingText: {
    fontSize: 16,
    color: '#6a6a6a',
    fontWeight: '300',
    letterSpacing: 1,
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  wave1: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(214, 197, 41, 0.1)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  wave2: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(214, 197, 41, 0.08)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  wave3: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: 'rgba(214, 197, 41, 0.05)',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
});
