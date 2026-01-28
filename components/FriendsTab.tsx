'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { Users, UserPlus, UserCheck, UserX, Search, Copy, Check, Share2, Link2 } from 'lucide-react';

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  friend_email?: string;
  friend_name?: string;
}

interface SharedModule {
  id: string;
  module_id: string;
  module_name?: string;
  share_code: string;
  is_public: boolean;
  created_at: string;
}

interface FriendsTabProps {
  onModuleImported?: () => void;
}

export default function FriendsTab({ onModuleImported }: FriendsTabProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [sharedModules, setSharedModules] = useState<SharedModule[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [shareCode, setShareCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Realtime subscriptions for friends and shared modules
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('friends-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friends',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friends',
          filter: `friend_id=eq.${user.id}`,
        },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_modules',
          filter: `shared_by=eq.${user.id}`,
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Load accepted friends
      const { data: friendsData } = await supabase
        .from('friends')
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      // Load pending requests (where I'm the friend_id - someone sent me a request)
      const { data: pendingData } = await supabase
        .from('friends')
        .select('*')
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      // Load my shared modules
      const { data: sharedData } = await supabase
        .from('shared_modules')
        .select(`
          id,
          module_id,
          share_code,
          is_public,
          created_at,
          modules:module_id (name)
        `)
        .eq('shared_by', user.id);

      setFriends(friendsData || []);
      setPendingRequests(pendingData || []);
      setSharedModules(
        (sharedData || []).map((s: any) => ({
          ...s,
          module_name: s.modules?.name,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async () => {
    if (!user || !searchEmail.trim()) return;
    setError('');
    setSuccess('');

    // Find user by email (we'd need a user_profiles lookup)
    // For now, we'll use a simplified approach
    setError(t('friends.error.emailComingSoon'));
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    const { error } = await (supabase
      .from('friends') as any)
      .update({ status: 'accepted' })
      .eq('id', friendshipId);

    if (!error) {
      setSuccess(t('friends.success.requestAccepted'));
      loadData();
    }
  };

  const rejectFriendRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', friendshipId);

    if (!error) {
      loadData();
    }
  };

  const importModuleByCode = async () => {
    if (!user || !shareCode.trim()) return;
    setError('');
    setSuccess('');

    // Find shared module by code
    const { data: sharedModule, error: findError } = await supabase
      .from('shared_modules')
      .select(`
        *,
        modules:module_id (*)
      `)
      .eq('share_code', shareCode.trim().toUpperCase())
      .single() as { data: any; error: any };

    if (findError || !sharedModule) {
      setError(t('friends.error.invalidCode'));
      return;
    }

    // Get flashcards from the original module
    const { data: flashcards } = await supabase
      .from('flashcards')
      .select('word, translation, source_lang, target_lang')
      .eq('module_id', sharedModule.module_id) as { data: any[] | null };

    if (!flashcards || flashcards.length === 0) {
      setError(t('friends.error.noFlashcards'));
      return;
    }

    // Create a new module for the user
    const originalModule = sharedModule.modules as any;
    const { data: newModule, error: moduleError } = await supabase
      .from('modules')
      .insert({
        user_id: user.id,
        name: `${originalModule.name} (imported)`,
        color: originalModule.color,
      } as any)
      .select()
      .single() as { data: any; error: any };

    if (moduleError || !newModule) {
      setError(t('friends.error.failedModule'));
      return;
    }

    // Copy flashcards to new module
    const newFlashcards = (flashcards || []).map((f: any) => ({
      ...f,
      user_id: user.id,
      module_id: newModule.id,
    }));

    const { error: flashcardsError } = await supabase
      .from('flashcards')
      .insert(newFlashcards as any);

    if (flashcardsError) {
      setError(t('friends.error.failedImport'));
      return;
    }

    setSuccess(t('friends.success.imported', { name: originalModule.name, count: flashcards.length }));
    setShareCode('');

    // Notify parent to refresh modules list
    if (onModuleImported) {
      onModuleImported();
    }
  };

  const copyShareCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto" />
        <p className="text-gray-400 mt-4">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Import Module Section */}
        <div className="glass-effect rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 gradient-cyan-purple rounded-xl flex items-center justify-center">
              <Link2 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">{t('friends.import')}</h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            {t('friends.importDesc')}
          </p>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={shareCode}
              onChange={(e) => setShareCode(e.target.value.toUpperCase())}
              placeholder={t('friends.shareCode') + ' (e.g., ABC123)'}
              className="w-full px-4 py-3 glass-effect border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white uppercase"
            />
            <button
              onClick={importModuleByCode}
              disabled={!shareCode.trim()}
              className="w-full px-6 py-3 gradient-cyan-purple rounded-xl text-white font-semibold disabled:opacity-50 hover:opacity-90 transition-all"
            >
              {t('friends.importBtn')}
            </button>
          </div>
        </div>

        {/* My Shared Modules */}
        <div className="glass-effect rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 gradient-purple-pink rounded-xl flex items-center justify-center">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">{t('friends.mySharedModules')}</h2>
          </div>

          {sharedModules.length === 0 ? (
            <p className="text-gray-400 text-sm">
              {t('friends.noSharedYet')}
            </p>
          ) : (
            <div className="space-y-3">
              {sharedModules.map((shared) => (
                <div
                  key={shared.id}
                  className="flex items-center justify-between p-4 glass-effect rounded-xl border border-white/10"
                >
                  <div>
                    <p className="text-white font-medium">{shared.module_name}</p>
                    <p className="text-gray-400 text-sm">
                      {t('friends.code')} <span className="font-mono text-cyan-400">{shared.share_code}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => copyShareCode(shared.share_code)}
                    className="p-2 glass-effect rounded-lg hover:bg-white/10 transition-all"
                  >
                    {copiedCode === shared.share_code ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Friend Requests */}
        {pendingRequests.length > 0 && (
          <div className="glass-effect rounded-2xl p-6 border border-yellow-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-yellow-400" />
              </div>
              <h2 className="text-xl font-bold text-white">{t('friends.friendRequests')}</h2>
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                {pendingRequests.length}
              </span>
            </div>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 glass-effect rounded-xl border border-white/10"
                >
                  <p className="text-white">{t('friends.requestFrom')}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptFriendRequest(request.id)}
                      className="p-2 bg-green-500/20 rounded-lg hover:bg-green-500/30 transition-all"
                    >
                      <UserCheck className="w-5 h-5 text-green-400" />
                    </button>
                    <button
                      onClick={() => rejectFriendRequest(request.id)}
                      className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-all"
                    >
                      <UserX className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="glass-effect rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 gradient-cyan-purple rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">{t('friends.title')}</h2>
            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
              {friends.length}
            </span>
          </div>

          {friends.length === 0 ? (
            <p className="text-gray-400 text-sm">
              {t('friends.noFriends')}
            </p>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-4 glass-effect rounded-xl border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 gradient-purple-pink rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {(friend.friend_name || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                    <p className="text-white">{friend.friend_name || t('friends.friend')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error/Success messages */}
        {error && (
          <div className="p-4 glass-effect rounded-xl border-2 border-red-500/50 text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 glass-effect rounded-xl border-2 border-green-500/50 text-green-400">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}
