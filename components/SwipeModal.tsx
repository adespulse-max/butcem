import React, { useRef, useEffect, useCallback } from 'react';
import {
  View, Modal, StyleSheet, Animated, PanResponder, Dimensions,
  TouchableWithoutFeedback, Keyboard, Platform, KeyboardAvoidingView,
  ScrollView, Text, TouchableOpacity,
} from 'react-native';
import { Colors, BorderRadius, Spacing } from '../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SwipeModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeightPercent?: number;
  minHeightPercent?: number;
}

export default function SwipeModal({ visible, onClose, children, maxHeightPercent = 90, minHeightPercent }: SwipeModalProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 200,
      }).start();
    } else {
      translateY.setValue(SCREEN_HEIGHT);
    }
  }, [visible]);

  const closeModal = useCallback(() => {
    Keyboard.dismiss();
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose());
  }, [onClose]);

  const handlePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 100 || gs.vy > 0.5) {
          closeModal();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 25,
            stiffness: 200,
          }).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={closeModal}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kav}
        >
          <Animated.View
            style={[
              styles.sheet,
              { maxHeight: SCREEN_HEIGHT * (maxHeightPercent / 100) },
              minHeightPercent ? { minHeight: SCREEN_HEIGHT * (minHeightPercent / 100) } : undefined,
              { transform: [{ translateY }] },
            ]}
          >
            {/* Handle area for swiping */}
            <View style={styles.handleContainer} {...handlePanResponder.panHandlers}>
              <View style={styles.handle} />
            </View>

            <ScrollView
              keyboardShouldPersistTaps="always" // CHANGED: Essential for button clicks while keyboard is up
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={styles.scrollContent}
            >
              {children}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export function NumericDoneBar() {
  return (
    <View style={styles.doneBar}>
      <TouchableOpacity onPress={() => Keyboard.dismiss()} style={styles.doneBtn} activeOpacity={0.7}>
        <Text style={styles.doneText}>Tamam</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  kav: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.backgroundLight,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    overflow: 'hidden',
  },
  handleContainer: { alignItems: 'center', paddingVertical: 15 },
  handle: { width: 40, height: 5, borderRadius: 2.5, backgroundColor: Colors.textMuted + '50' },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  doneBar: {
    backgroundColor: Colors.cardBg,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'flex-end',
  },
  doneBtn: {
    backgroundColor: Colors.neonPurple + '20',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  doneText: { color: Colors.neonPurple, fontWeight: '700' },
});
