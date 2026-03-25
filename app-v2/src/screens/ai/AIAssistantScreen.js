// ---------------------------------------------------------------------------
// Pepete v2.0 - AI Assistant Screen
// Q&A interface for pet-related questions. Session-only conversation.
// Not a persistent chat -- each session starts fresh.
// ---------------------------------------------------------------------------

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Keyboard,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import Icon from '../../components/Icon';
import Card from '../../components/Card';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../context/AuthContext';
import { getMyPetsAPI } from '../../api/pets';
import { askAIAPI } from '../../api/ai';
import { showAlert } from '../../utils/alert';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/colors';
import { FONTS, TEXT_STYLES } from '../../utils/typography';


// ---------------------------------------------------------------------------
// Suggested questions (shown when conversation is empty)
// ---------------------------------------------------------------------------
const SUGGESTED_QUESTIONS = [
  {
    id: '1',
    text: 'Mon chien ne mange plus, que faire ?',
    icon: 'help-circle',
  },
  {
    id: '2',
    text: 'Quelle alimentation pour un chat senior ?',
    icon: 'help-circle',
  },
  {
    id: '3',
    text: "Premiers gestes en cas d'urgence",
    icon: 'help-circle',
  },
  {
    id: '4',
    text: 'Comment eduquer un chiot ?',
    icon: 'help-circle',
  },
];


// ---------------------------------------------------------------------------
// Typing indicator with animated dots
// ---------------------------------------------------------------------------
const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );

    const a1 = createAnimation(dot1, 0);
    const a2 = createAnimation(dot2, 200);
    const a3 = createAnimation(dot3, 400);
    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  const dotStyle = (anim) => ({
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -4],
        }),
      },
    ],
  });

  return (
    <View style={styles.typingContainer}>
      {/* Paw icon */}
      <View style={styles.pawBubbleIcon}>
        <Icon name="paw" family="ionicons" size={14} color={COLORS.primary} />
      </View>
      <View style={styles.typingBubble}>
        <Animated.View style={[styles.typingDot, dotStyle(dot1)]} />
        <Animated.View style={[styles.typingDot, dotStyle(dot2)]} />
        <Animated.View style={[styles.typingDot, dotStyle(dot3)]} />
      </View>
    </View>
  );
};


// ---------------------------------------------------------------------------
// Disclaimer banner
// ---------------------------------------------------------------------------
const DisclaimerBanner = ({ compact = false }) => (
  <View style={[styles.disclaimerCard, compact && styles.disclaimerCompact]}>
    <Icon
      name="alert-triangle"
      size={compact ? 14 : 18}
      color={COLORS.warning}
      style={styles.disclaimerIcon}
    />
    <Text style={[styles.disclaimerText, compact && styles.disclaimerTextCompact]}>
      Je ne remplace pas un veterinaire. Pour toute urgence, consultez un professionnel.
    </Text>
  </View>
);


// ---------------------------------------------------------------------------
// Pet selector ribbon item
// ---------------------------------------------------------------------------
const PetSelectorItem = ({ pet, isSelected, onSelect }) => (
  <TouchableOpacity
    style={[styles.petItem, isSelected && styles.petItemSelected]}
    onPress={() => onSelect(pet)}
    activeOpacity={0.7}
  >
    <Avatar
      name={pet.name}
      size="sm"
      style={isSelected ? styles.petAvatarSelected : undefined}
    />
    <Text
      style={[
        styles.petItemName,
        isSelected && styles.petItemNameSelected,
      ]}
      numberOfLines={1}
    >
      {pet.name}
    </Text>
  </TouchableOpacity>
);


// ---------------------------------------------------------------------------
// Simple markdown renderer for AI responses
// Handles: **bold**, bullet lists (- item), and line breaks
// ---------------------------------------------------------------------------
const renderMarkdownText = (text, textStyle) => {
  const lines = text.split('\n');
  const elements = [];

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    // Skip empty lines but add spacing
    if (!trimmed) {
      elements.push(<View key={`sp-${lineIdx}`} style={{ height: 8 }} />);
      return;
    }

    // Bullet list items
    const bulletMatch = trimmed.match(/^[-•]\s+(.*)/);
    const isBullet = !!bulletMatch;
    const content = isBullet ? bulletMatch[1] : trimmed;

    // Parse inline **bold** within the line
    const parts = [];
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: content.slice(lastIndex, match.index), bold: false });
      }
      parts.push({ text: match[1], bold: true });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      parts.push({ text: content.slice(lastIndex), bold: false });
    }

    const textElements = parts.map((part, partIdx) => (
      <Text
        key={`${lineIdx}-${partIdx}`}
        style={[textStyle, part.bold && { fontWeight: '700' }]}
      >
        {part.text}
      </Text>
    ));

    if (isBullet) {
      elements.push(
        <View key={`line-${lineIdx}`} style={mdStyles.bulletRow}>
          <Text style={[textStyle, mdStyles.bulletDot]}>{'\u2022'}</Text>
          <Text style={[textStyle, mdStyles.bulletText]}>{textElements}</Text>
        </View>
      );
    } else {
      elements.push(
        <Text key={`line-${lineIdx}`} style={textStyle}>
          {textElements}
        </Text>
      );
    }
  });

  return <View>{elements}</View>;
};

const mdStyles = StyleSheet.create({
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 3,
    paddingLeft: 2,
  },
  bulletDot: {
    marginRight: 8,
    fontSize: 14,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    lineHeight: 22,
  },
});


// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------
const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAI]}>
      {/* AI paw icon */}
      {!isUser && (
        <View style={styles.pawBubbleIcon}>
          <Icon name="paw" family="ionicons" size={14} color={COLORS.primary} />
        </View>
      )}

      <View
        style={[
          styles.messageBubble,
          isUser ? styles.messageBubbleUser : styles.messageBubbleAI,
        ]}
      >
        {isUser ? (
          <Text style={[styles.messageText, styles.messageTextUser]}>
            {message.text}
          </Text>
        ) : (
          renderMarkdownText(
            message.text,
            [styles.messageText, styles.messageTextAI]
          )
        )}
      </View>
    </View>
  );
};


// ---------------------------------------------------------------------------
// Suggested question card
// ---------------------------------------------------------------------------
const SuggestedQuestion = ({ question, onPress }) => (
  <Card
    variant="outlined"
    onPress={() => onPress(question.text)}
    style={styles.suggestedCard}
  >
    <View style={styles.suggestedRow}>
      <View style={styles.suggestedIconWrap}>
        <Icon name={question.icon} size={18} color={COLORS.primary} />
      </View>
      <Text style={styles.suggestedText}>{question.text}</Text>
      <Icon name="chevron-right" size={16} color={COLORS.pebble} />
    </View>
  </Card>
);


// =========================================================================
// Main Screen
// =========================================================================
const AIAssistantScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const scrollViewRef = useRef(null);

  // State
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [petsLoading, setPetsLoading] = useState(true);

  // Fetch user's pets on screen focus (only if logged in)
  useFocusEffect(
    useCallback(() => {
      if (!user) {
        setPetsLoading(false);
        return;
      }
      let cancelled = false;
      const fetchPets = async () => {
        setPetsLoading(true);
        try {
          const res = await getMyPetsAPI();
          if (cancelled) return;
          const petsList = res.data?.pets || res.data || [];
          setPets(petsList);
        } catch (err) {
          if (cancelled) return;
          console.log('AI screen - pets fetch error:', err?.message ?? err);
        } finally {
          if (!cancelled) {
            setPetsLoading(false);
          }
        }
      };
      fetchPets();

      return () => {
        cancelled = true;
      };
    }, [user])
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Double scroll: once quickly, once after render settles (important for web)
      const t1 = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd?.({ animated: true });
      }, 100);
      const t2 = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd?.({ animated: true });
      }, 400);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [messages, isLoading]);

  // Send a question
  const handleSend = useCallback(async (questionText) => {
    const question = (questionText || inputText).trim();
    if (!question || isLoading) return;

    // Clear input
    setInputText('');
    Keyboard.dismiss();

    // Add user message
    const userMessage = { id: Date.now().toString(), role: 'user', text: question };
    setMessages((prev) => [...prev, userMessage]);

    // Build pet context
    const petContext = selectedPet
      ? {
          name: selectedPet.name,
          species: selectedPet.species,
          breed: selectedPet.breed,
          age: selectedPet.age,
          weight: selectedPet.weight,
        }
      : undefined;

    // Call API
    setIsLoading(true);
    try {
      const res = await askAIAPI(question, petContext);
      const answer =
        res.data?.answer ||
        res.data?.message ||
        "Desole, je n'ai pas pu generer une reponse. Reessayez.";
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: answer,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const isNetwork =
        err?.message?.includes('Network') || err?.message?.includes('timeout');
      const errorText = isNetwork
        ? 'Impossible de contacter le serveur. Verifiez votre connexion et reessayez.'
        : 'Oups, une erreur est survenue. Reessayez dans quelques instants.';
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: errorText,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, selectedPet]);

  const handleSelectPet = useCallback((pet) => {
    setSelectedPet((prev) => (prev?._id === pet._id ? null : pet));
  }, []);

  const hasConversation = messages.length > 0;

  return (
    <View style={styles.container}>
      <ScreenHeader
        variant="light"
        title="Assistant Pepete"
        subtitle="Posez vos questions"
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Scrollable content */}
        <ScrollView
          ref={scrollViewRef}
          style={[styles.flex, Platform.OS === 'web' && { overflow: 'auto' }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {/* Disclaimer banner */}
          <DisclaimerBanner />

          {/* Pet selector ribbon */}
          {pets.length > 0 && (
            <View style={styles.petSelectorSection}>
              <Text style={styles.petSelectorLabel}>Contexte animal :</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.petSelectorList}
                nestedScrollEnabled
              >
                {pets.map((item) => (
                  <PetSelectorItem
                    key={item._id || item.name}
                    pet={item}
                    isSelected={selectedPet?._id === item._id}
                    onSelect={handleSelectPet}
                  />
                ))}
              </ScrollView>
              {selectedPet && (
                <Text style={styles.petContextHint}>
                  Questions orientees pour {selectedPet.name} ({selectedPet.species}
                  {selectedPet.breed ? `, ${selectedPet.breed}` : ''})
                </Text>
              )}
            </View>
          )}

          {/* Suggested questions (only when no conversation) */}
          {!hasConversation && (
            <View style={styles.suggestionsSection}>
              <Text style={styles.suggestionsTitle}>Questions frequentes</Text>
              {SUGGESTED_QUESTIONS.map((q) => (
                <SuggestedQuestion
                  key={q.id}
                  question={q}
                  onPress={handleSend}
                />
              ))}
            </View>
          )}

          {/* Messages */}
          {hasConversation && (
            <View style={styles.messagesSection}>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {/* Typing indicator */}
              {isLoading && <TypingIndicator />}

              {/* Post-answer disclaimer */}
              {messages.length > 0 &&
                messages[messages.length - 1].role === 'assistant' &&
                !isLoading && <DisclaimerBanner compact />}
            </View>
          )}

          {/* Bottom padding */}
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Sticky input bar */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(SPACING.sm, insets.bottom) }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Posez votre question..."
              placeholderTextColor={COLORS.placeholder}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              blurOnSubmit={false}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={() => handleSend()}
              disabled={!inputText.trim() || isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.textInverse} />
              ) : (
                <Icon name="arrow-up" size={20} color={COLORS.textInverse} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};


// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  flex: {
    flex: 1,
    ...(Platform.OS === 'web' ? { overflow: 'hidden' } : {}),
  },
  scrollContent: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    flexGrow: 1,
  },
  bottomSpacer: {
    height: 120,
  },

  // -- Disclaimer --
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.base,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  disclaimerCompact: {
    padding: SPACING.sm,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  disclaimerIcon: {
    marginRight: SPACING.sm,
    marginTop: 1,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.stone,
    lineHeight: 18,
  },
  disclaimerTextCompact: {
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.pebble,
  },

  // -- Pet selector --
  petSelectorSection: {
    marginBottom: SPACING.base,
  },
  petSelectorLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  petSelectorList: {
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  petItem: {
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 70,
  },
  petItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  petAvatarSelected: {
    // No extra styles needed -- border on parent highlights selection
  },
  petItemName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  petItemNameSelected: {
    color: COLORS.primary,
    fontFamily: FONTS.bodySemiBold,
  },
  petContextHint: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.primary,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },

  // -- Suggestions --
  suggestionsSection: {
    marginTop: SPACING.sm,
  },
  suggestionsTitle: {
    fontFamily: FONTS.brand,
    fontSize: 18,
    color: COLORS.charcoal,
    marginBottom: SPACING.md,
  },
  suggestedCard: {
    marginVertical: 4,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  suggestedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  suggestedIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestedText: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.charcoal,
    lineHeight: 20,
  },

  // -- Messages --
  messagesSection: {
    marginTop: SPACING.sm,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAI: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  messageBubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: RADIUS.xs,
    ...SHADOWS.sm,
  },
  messageBubbleAI: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextUser: {
    color: COLORS.textInverse,
  },
  messageTextAI: {
    color: COLORS.charcoal,
  },
  pawBubbleIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },

  // -- Typing indicator --
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderBottomLeftRadius: RADIUS.xs,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.pebble,
  },

  // -- Input bar --
  inputBar: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.linen,
    borderRadius: RADIUS.xl,
    paddingLeft: SPACING.base,
    paddingRight: SPACING.xs,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : SPACING.xs,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.charcoal,
    maxHeight: 100,
    paddingVertical: Platform.OS === 'ios' ? 6 : 8,
    paddingRight: SPACING.sm,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 0 : 2,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.sand,
  },
});

export default AIAssistantScreen;
