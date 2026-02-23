import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Animated,
  ActivityIndicator, StatusBar, Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { FONTS } from '../../utils/typography';
const colors = require('../../utils/colors');
const { SHADOWS, RADIUS, SPACING, FONT_SIZE } = require('../../utils/colors');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_MESSAGE_LENGTH = 1000;

/* ---------- Scroll to Bottom FAB ---------- */
const ScrollToBottomFAB = ({ visible, onPress, unreadCount }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: visible ? 1 : 0,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.scrollFab, {
      opacity: anim,
      transform: [{ scale: anim }],
    }]}>
      <TouchableOpacity
        style={styles.scrollFabBtn}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Feather name="chevron-down" size={20} color={colors.primary} />
        {unreadCount > 0 && (
          <View style={styles.scrollFabBadge}>
            <Text style={styles.scrollFabBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ---------- Main Screen ---------- */
const MessagesScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { userId, userName } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showScrollFab, setShowScrollFab] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const flatListRef = useRef();
  const inputRef = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const prevMessageCount = useRef(0);

  useEffect(() => {
    loadMessages(true);
    const interval = setInterval(() => loadMessages(false), 5000);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async (isInitial = false) => {
    try {
      const response = await api.get(`/messages/${userId}`);
      const newMessages = response.data.messages || [];
      setMessages((prev) => {
        if (JSON.stringify(prev.map(m => m._id)) !== JSON.stringify(newMessages.map(m => m._id))) {
          // If new messages arrived and user is at bottom, auto-scroll
          if (newMessages.length > prevMessageCount.current && isNearBottom) {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
          prevMessageCount.current = newMessages.length;
          return newMessages;
        }
        return prev;
      });
    } catch (error) {
      console.log('Erreur messages:', error);
    } finally {
      if (isInitial) setInitialLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      await api.post('/messages', {
        receiver: userId,
        content: messageText,
      });
      await loadMessages(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.log('Erreur envoi message:', error);
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const onScroll = useCallback((event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    const nearBottom = distanceFromBottom < 150;
    setIsNearBottom(nearBottom);
    setShowScrollFab(!nearBottom && messages.length > 5);
  }, [messages.length]);

  const formatTime = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const formatDateSeparator = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
      if (date.toDateString() === yesterday.toDateString()) return 'Hier';

      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    } catch {
      return '';
    }
  };

  const shouldShowDateSeparator = (index) => {
    if (index === 0) return true;
    const current = new Date(messages[index]?.createdAt).toDateString();
    const previous = new Date(messages[index - 1]?.createdAt).toDateString();
    return current !== previous;
  };

  // Group consecutive messages from same sender
  const isFirstInGroup = (index) => {
    if (index === 0) return true;
    const currentSender = messages[index]?.sender?._id || messages[index]?.sender;
    const prevSender = messages[index - 1]?.sender?._id || messages[index - 1]?.sender;
    if (shouldShowDateSeparator(index)) return true;
    return currentSender !== prevSender;
  };

  const isLastInGroup = (index) => {
    if (index === messages.length - 1) return true;
    const currentSender = messages[index]?.sender?._id || messages[index]?.sender;
    const nextSender = messages[index + 1]?.sender?._id || messages[index + 1]?.sender;
    if (index + 1 < messages.length && shouldShowDateSeparator(index + 1)) return true;
    return currentSender !== nextSender;
  };

  const receiverInitial = userName?.charAt(0)?.toUpperCase() || '?';

  const renderMessage = useCallback(({ item, index }) => {
    const isMe = item.sender?._id === user?.id || item.sender === user?.id;
    const showDate = shouldShowDateSeparator(index);
    const firstInGroup = isFirstInGroup(index);
    const lastInGroup = isLastInGroup(index);

    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <View style={styles.dateLine} />
            <View style={styles.datePill}>
              <Text style={styles.dateText}>
                {formatDateSeparator(item.createdAt)}
              </Text>
            </View>
            <View style={styles.dateLine} />
          </View>
        )}

        <View style={[
          styles.messageRow,
          isMe ? styles.messageRowRight : styles.messageRowLeft,
          !lastInGroup && { marginBottom: 2 },
        ]}>
          {/* Receiver avatar on left - only show for last in group */}
          {!isMe && lastInGroup && (
            <View style={styles.messageBubbleAvatar}>
              <Text style={styles.messageBubbleInitial}>{receiverInitial}</Text>
            </View>
          )}
          {!isMe && !lastInGroup && (
            <View style={styles.messageBubbleAvatarSpacer} />
          )}

          <View
            style={[
              styles.messageBubble,
              isMe ? styles.myMessage : styles.otherMessage,
              // Rounded corners based on position in group
              isMe && firstInGroup && { borderTopRightRadius: RADIUS.xl },
              isMe && !firstInGroup && { borderTopRightRadius: RADIUS.xs },
              isMe && lastInGroup && { borderBottomRightRadius: RADIUS.xs },
              !isMe && firstInGroup && { borderTopLeftRadius: RADIUS.xl },
              !isMe && !firstInGroup && { borderTopLeftRadius: RADIUS.xs },
              !isMe && lastInGroup && { borderBottomLeftRadius: RADIUS.xs },
            ]}
          >
            {isMe ? (
              <View
                style={[
                  styles.myMessageInner,
                  firstInGroup && { borderTopRightRadius: RADIUS.xl },
                  !firstInGroup && { borderTopRightRadius: RADIUS.xs },
                  lastInGroup && { borderBottomRightRadius: RADIUS.xs },
                ]}
              >
                <Text style={styles.myMessageText}>{item.content}</Text>
                {lastInGroup && (
                  <View style={styles.myTimeRow}>
                    <Text style={styles.myTime}>{formatTime(item.createdAt)}</Text>
                    <Feather name="check" size={10} color={colors.pebble} />
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.otherMessageInner}>
                <Text style={styles.otherMessageText}>{item.content}</Text>
                {lastInGroup && (
                  <Text style={styles.otherTime}>{formatTime(item.createdAt)}</Text>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }, [messages, user]);

  const renderEmpty = () => {
    if (initialLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Feather name="message-circle" size={36} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Demarrez la conversation</Text>
        <Text style={styles.emptySubtext}>
          Envoyez un message a {userName || 'ce gardien'}{'\n'}pour organiser la garde de votre animal
        </Text>
        <View style={styles.emptySuggestions}>
          {['Bonjour !', 'Disponible cette semaine ?', 'Tarifs pour 2 jours ?'].map((suggestion, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.emptySuggestionChip}
              onPress={() => setNewMessage(suggestion)}
              activeOpacity={0.7}
            >
              <Text style={styles.emptySuggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const charCount = newMessage.length;
  const isOverLimit = charCount > MAX_MESSAGE_LENGTH;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={20} color={colors.white} />
          </TouchableOpacity>

          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarLetter}>{receiverInitial}</Text>
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>
              {userName || 'Conversation'}
            </Text>
            <View style={styles.headerOnlineRow}>
              <View style={styles.headerOnlineDot} />
              <Text style={styles.headerOnlineText}>En ligne</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Messages */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {initialLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Chargement des messages...</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item._id}
              contentContainerStyle={[
                styles.messagesList,
                messages.length === 0 && styles.messagesListEmpty,
              ]}
              showsVerticalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              onContentSizeChange={() => {
                if (messages.length > 0 && isNearBottom) {
                  flatListRef.current?.scrollToEnd({ animated: false });
                }
              }}
              onLayout={() => {
                if (messages.length > 0) {
                  flatListRef.current?.scrollToEnd({ animated: false });
                }
              }}
              ListEmptyComponent={renderEmpty}
            />

            <ScrollToBottomFAB
              visible={showScrollFab}
              onPress={scrollToBottom}
              unreadCount={0}
            />
          </View>
        )}
      </Animated.View>

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <View style={[
          styles.inputContainer,
          newMessage.length > 0 && styles.inputContainerActive,
        ]}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Votre message..."
            placeholderTextColor={colors.placeholder}
            multiline
            maxLength={MAX_MESSAGE_LENGTH + 50}
            onFocus={() => {
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 300);
            }}
          />
        </View>

        <TouchableOpacity
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending || isOverLimit}
          activeOpacity={0.7}
          style={styles.sendBtnWrapper}
        >
          {newMessage.trim() && !isOverLimit ? (
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.sendBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Feather name="send" size={18} color={colors.white} />
              )}
            </LinearGradient>
          ) : (
            <View style={[styles.sendBtn, styles.sendBtnDisabled]}>
              <Feather name="send" size={18} color={colors.textLight} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },

  // Header
  header: {
    paddingBottom: SPACING.md + 2,
    paddingHorizontal: SPACING.base,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  headerAvatarLetter: {
    fontSize: FONT_SIZE.lg,
    fontFamily: FONTS.heading,
    color: colors.white,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: FONT_SIZE.md,
    fontFamily: FONTS.heading,
    color: colors.white,
  },
  headerOnlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: 2,
  },
  headerOnlineDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
    backgroundColor: '#10B981',
  },
  headerOnlineText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodyMedium,
    color: 'rgba(255,255,255,0.75)',
  },

  // Messages List
  messagesList: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.base,
  },
  messagesListEmpty: {
    flexGrow: 1,
  },

  // Date Separator
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
    gap: SPACING.md,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  datePill: {
    backgroundColor: colors.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    ...SHADOWS.sm,
  },
  dateText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodySemiBold,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },

  // Message Row
  messageRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    alignItems: 'flex-end',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },

  // Bubble Avatar (for receiver)
  messageBubbleAvatar: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.full,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  messageBubbleAvatarSpacer: {
    width: 30,
    marginRight: SPACING.sm,
  },
  messageBubbleInitial: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.heading,
    color: colors.accent,
  },

  // Message Bubble
  messageBubble: {
    maxWidth: '75%',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  myMessage: {
    borderBottomRightRadius: RADIUS.xs,
    backgroundColor: colors.primarySoft,
  },
  otherMessage: {
    borderBottomLeftRadius: RADIUS.xs,
    backgroundColor: colors.white,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  // My message (primarySoft bg)
  myMessageInner: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xs,
  },
  myMessageText: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.body,
    lineHeight: 22,
    color: colors.charcoal,
  },
  myTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  myTime: {
    fontSize: FONT_SIZE.xs - 1,
    fontFamily: FONTS.body,
    color: colors.pebble,
  },

  // Other message
  otherMessageInner: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
  },
  otherMessageText: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.body,
    lineHeight: 22,
    color: colors.text,
  },
  otherTime: {
    fontSize: FONT_SIZE.xs - 1,
    fontFamily: FONTS.body,
    color: colors.textTertiary,
    marginTop: SPACING.xs,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING['2xl'],
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontFamily: FONTS.heading,
    color: colors.text,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  emptySuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  emptySuggestionChip: {
    backgroundColor: colors.white,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: colors.primary + '30',
    ...SHADOWS.sm,
  },
  emptySuggestionText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
    color: colors.primary,
  },

  // Scroll FAB
  scrollFab: {
    position: 'absolute',
    bottom: SPACING.base,
    right: SPACING.base,
    zIndex: 10,
  },
  scrollFabBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  scrollFabBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: RADIUS.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollFabBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.heading,
    color: colors.white,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodyMedium,
    color: colors.textSecondary,
  },

  // Input Bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? SPACING['2xl'] + 4 : SPACING.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: SPACING.sm,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: RADIUS['2xl'],
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: SPACING.base,
    paddingVertical: Platform.OS === 'ios' ? SPACING.md : SPACING.sm,
    maxHeight: 120,
  },
  inputContainerActive: {
    borderColor: colors.primary + '40',
    backgroundColor: colors.white,
  },
  input: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.body,
    color: colors.text,
    lineHeight: 22,
    maxHeight: 100,
    paddingVertical: 0,
  },
  sendBtnWrapper: {
    marginBottom: Platform.OS === 'ios' ? 2 : 0,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.border,
  },
});

export default MessagesScreen;
