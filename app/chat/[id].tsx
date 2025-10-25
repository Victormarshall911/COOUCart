import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Send, Check, CheckCheck, Star } from 'lucide-react-native';

type Message = Database['public']['Tables']['messages']['Row'] & {
  profiles: {
    full_name: string | null;
  } | null;
  _localStatus?: 'sending' | 'sent' | 'delivered';
  _tempId?: string;
};

type Chat = Database['public']['Tables']['chats']['Row'] & {
  products: {
    title: string;
    price: number;
  } | null;
  buyer_profile: {
    full_name: string | null;
  } | null;
  business_profile: {
    full_name: string | null;
  } | null;
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [existingRating, setExistingRating] = useState<{ stars: number; comment: string | null } | null>(null);
  const [ratingStars, setRatingStars] = useState<number>(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const { profile } = useAuth();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id) return;
    loadChat();
    loadMessages();
    const unsubscribe = subscribeToMessages();
    return () => {
      try { unsubscribe && unsubscribe(); } catch {}
    };
  }, [id]);

  useEffect(() => {
    if (id && chat?.status === 'closed') {
      loadExistingRating();
    }
  }, [id, chat?.status]);

  async function loadChat() {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          products(title, price),
          buyer_profile:profiles!chats_buyer_id_fkey(full_name),
          business_profile:profiles!chats_business_id_fkey(full_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setChat(data);
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  }

  async function loadMessages() {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles(full_name)')
        .eq('chat_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }

  function subscribeToMessages() {
    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${id}`,
        },
        (payload) => {
          const newMsg = payload.new as unknown as Message;
          setMessages((prev) => {
            const existsIndex = prev.findIndex(m => m.id === newMsg.id);
            if (existsIndex !== -1) {
              const updated = [...prev];
              const isOwn = newMsg.sender_id === profile?.id;
              updated[existsIndex] = { ...newMsg, _localStatus: isOwn ? 'delivered' : undefined };
              return updated;
            }
            // Replace temp if content and sender match
            const tempIndex = prev.findIndex(m => m._tempId && m.sender_id === newMsg.sender_id && m.content === newMsg.content);
            if (tempIndex !== -1) {
              const updated = [...prev];
              const isOwn = newMsg.sender_id === profile?.id;
              updated[tempIndex] = { ...newMsg, _localStatus: isOwn ? 'delivered' : undefined };
              return updated;
            }
            const isOwn = newMsg.sender_id === profile?.id;
            return [...prev, { ...newMsg, _localStatus: isOwn ? 'delivered' : undefined }];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function sendMessage() {
    if (!newMessage.trim() || sending || chat?.status === 'closed') return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      // optimistic local message
      const tempId = `temp-${Date.now()}`;
      const tempMessage: Message = {
        id: tempId as any,
        chat_id: id as any,
        sender_id: profile!.id,
        content: messageText,
        created_at: new Date().toISOString(),
        profiles: { full_name: profile?.full_name || null },
        _localStatus: 'sending',
        _tempId: tempId,
      } as any;
      setMessages(prev => [...prev, tempMessage]);

      const { data: inserted, error } = await supabase
        .from('messages')
        .insert({
          chat_id: id,
          sender_id: profile!.id,
          content: messageText,
        })
        .select('*, profiles(full_name)')
        .single();

      if (error) throw error;
      if (inserted) {
        setMessages((prev) => {
          const idx = prev.findIndex(m => m._tempId === tempId);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = { ...inserted, _localStatus: 'sent' } as Message;
            return updated;
          }
          return [...prev, { ...inserted, _localStatus: 'sent' } as Message];
        });
        requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }

  async function completeTransaction() {
    if (completing) return;

    setCompleting(true);
    try {
      const { error } = await supabase
        .from('chats')
        .update({ status: 'closed' })
        .eq('id', id);

      if (error) throw error;
      setChat(prev => prev ? { ...prev, status: 'closed' } : null);
      await loadExistingRating();
    } catch (error) {
      console.error('Error completing transaction:', error);
      alert('Failed to complete transaction. Please try again.');
    } finally {
      setCompleting(false);
    }
  }

  async function loadExistingRating() {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('stars, comment')
        .eq('chat_id', id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setExistingRating({ stars: data.stars, comment: data.comment });
      } else {
        setExistingRating(null);
      }
    } catch (e) {
      console.error('Error loading rating:', e);
    }
  }

  async function submitRating() {
    if (ratingSubmitting) return;
    if (!profile || !chat) return;
    if (ratingStars < 1 || ratingStars > 5) {
      alert('Please select 1 to 5 stars');
      return;
    }
    setRatingSubmitting(true);
    try {
      const { error } = await supabase
        .from('ratings')
        .insert({
          chat_id: id,
          business_id: chat.business_id,
          customer_id: chat.buyer_id,
          stars: ratingStars,
          comment: ratingComment || null,
        });
      if (error) throw error;
      setExistingRating({ stars: ratingStars, comment: ratingComment || null });
      setRatingStars(0);
      setRatingComment('');
    } catch (e) {
      console.error('Error submitting rating:', e);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setRatingSubmitting(false);
    }
  }

  function renderMessage({ item }: { item: Message }) {
    const isOwnMessage = item.sender_id === profile?.id;

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage,
      ]}>
        {!isOwnMessage && (
          <Text style={styles.messageSender}>
            {item.profiles?.full_name || 'Unknown'}
          </Text>
        )}
        <Text style={[
          styles.messageText,
          isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
        ]}>
          {item.content}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.messageTime}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isOwnMessage && (
            <View style={styles.statusIcon}>
              {item._localStatus === 'delivered' ? (
                <CheckCheck size={14} color="#fff" />
              ) : item._localStatus === 'sent' ? (
                <Check size={14} color="#fff" />
              ) : item._localStatus === 'sending' ? (
                <Check size={14} color="#cfe3ff" />
              ) : null}
            </View>
          )}
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6a6a6a" />
      </View>
    );
  }

  const isBusiness = profile?.id === chat?.business_id;
  const canComplete = isBusiness && chat?.status === 'open';

  const formatNaira = (value: number) =>
  `₦${value.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#4a4a4a" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {chat?.products?.title || 'Chat'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {formatNaira(chat?.products?.price || 0)}
          </Text>
        </View>
        {canComplete && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={completeTransaction}
            disabled={completing}
          >
            {completing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Check size={20} color="#fff" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {chat?.status === 'closed' && (
        <View style={styles.closedBanner}>
          <Text style={styles.closedText}>This chat is closed</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
      />

      {chat?.status === 'open' && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
            editable={!sending}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      )}

      {chat?.status === 'closed' && profile?.id === chat?.buyer_id && (
        <View style={styles.ratingCard}>
          {existingRating ? (
            <View>
              <Text style={styles.ratingTitle}>You rated this business</Text>
              <View style={styles.starsRow}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} size={18} color={i < existingRating.stars ? '#f5a623' : '#ccc'} fill={i < existingRating.stars ? '#f5a623' : 'none'} />
                ))}
              </View>
              {existingRating.comment ? (
                <Text style={styles.ratingCommentText}>{existingRating.comment}</Text>
              ) : null}
            </View>
          ) : (
            <View>
              <Text style={styles.ratingTitle}>Rate this business</Text>
              <View style={styles.starsRow}>
                {Array.from({ length: 5 }, (_, i) => {
                  const index = i + 1;
                  const active = index <= ratingStars;
                  return (
                    <TouchableOpacity key={i} onPress={() => setRatingStars(index)}>
                      <Star size={24} color={active ? '#f5a623' : '#ccc'} fill={active ? '#f5a623' : 'none'} />
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput
                style={styles.ratingInput}
                placeholder="Leave a comment (optional)"
                value={ratingComment}
                onChangeText={setRatingComment}
                multiline
                maxLength={300}
              />
              <TouchableOpacity
                style={[styles.submitRatingButton, ratingSubmitting && styles.sendButtonDisabled]}
                onPress={submitRating}
                disabled={ratingSubmitting || ratingStars < 1}
              >
                {ratingSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitRatingText}>Submit Rating</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a4a4a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6a6a6a',
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#6a6a6a',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  closedBanner: {
    backgroundColor: '#e8e8e8',
    padding: 12,
    alignItems: 'center',
  },
  closedText: {
    color: '#6a6a6a',
    fontSize: 14,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6a6a6a',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fafafa',
  },
  messageSender: {
    fontSize: 12,
    color: '#6a6a6a',
    marginBottom: 4,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#4a4a4a',
  },
  messageTime: {
    fontSize: 11,
    color: '#8a8a8a',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fafafa',
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#6a6a6a',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  ratingCard: {
    backgroundColor: '#fafafa',
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
    padding: 16,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a4a4a',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  ratingInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 12,
    minHeight: 60,
    fontSize: 14,
    marginBottom: 12,
  },
  submitRatingButton: {
    backgroundColor: '#6a6a6a',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitRatingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  statusIcon: {
    marginLeft: 4,
  },
  ratingCommentText: {
    fontSize: 14,
    color: '#5a5a5a',
    marginTop: 8,
  },
});
