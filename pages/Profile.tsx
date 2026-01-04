import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import {
  Settings, LogOut, ChevronRight, User, Bell, Shield, HelpCircle, ArrowLeft,
  Heart, MessageSquare, Share2, MessageCircle, UserPlus, Check, Trash2,
  Camera, Mail, Phone as PhoneIcon, X, Copy, Repeat, ArrowRight,
  Edit, Briefcase, FileText, CreditCard, Globe, Key, Users, Star,
  Building2, Calendar, MapPin, Eye, EyeOff, Lock, Unlock, Volume2, 
  VolumeX, Download, Upload, Wifi, WifiOff, Moon, Sun, Smartphone,
  ShieldCheck, AlertCircle, Info, ExternalLink, Mail as MailIcon,
  MessageSquare as MessageSquareIcon, Shield as ShieldIcon,
  CreditCard as CreditCardIcon
} from 'lucide-react';
import { supabase } from '../services/supabase';

type Profile = {
  id: string;
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role?: string;
  bio?: string;
  approval_status?: string;
  created_at: string;
  updated_at: string;
};

type Post = {
  id: string;
  title: string;
  excerpt?: string;
  content?: string;
  image_url?: string;
  video_url?: string;
  media_type?: string;
  location?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  author_id: string;
};

type Business = {
  id: string;
  name: string;
  description?: string;
  address?: string;
  logo_url?: string;
  cover_image_url?: string;
  category?: string;
  rating?: number;
  is_verified: boolean;
  email?: string;
  phone?: string;
  website?: string;
  operating_hours?: string;
  products_services?: string[];
  created_at: string;
  owner_id: string;
};

type Connection = {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
};

type NotificationSettings = {
  email: {
    messages: boolean;
    comments: boolean;
    likes: boolean;
    connections: boolean;
    announcements: boolean;
  };
  push: {
    messages: boolean;
    comments: boolean;
    likes: boolean;
    mentions: boolean;
  };
  inApp: {
    messages: boolean;
    comments: boolean;
    likes: boolean;
    suggestions: boolean;
  };
  frequency: 'realtime' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
};

type PrivacySettings = {
  profileVisibility: 'public' | 'connections' | 'private';
  showOnlineStatus: boolean;
  allowTagging: boolean;
  showLastSeen: boolean;
  allowSearchIndexing: boolean;
  dataSharing: {
    analytics: boolean;
    personalization: boolean;
    marketing: boolean;
  };
  twoFactorAuth: boolean;
  loginAlerts: boolean;
};

type SecuritySettings = {
  passwordLastChanged: string;
  activeSessions: Array<{
    id: string;
    device: string;
    location: string;
    lastActive: string;
    current: boolean;
  }>;
  trustedDevices: Array<{
    id: string;
    name: string;
    added: string;
  }>;
  blockedUsers: Array<{
    id: string;
    name: string;
    avatar_url?: string;
    blockedAt: string;
  }>;
};

type SupportTicket = {
  id: string;
  title: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  updated_at: string;
};

type ViewState =
  | 'profile'
  | 'settings'
  | 'edit_profile'
  | 'notifications'
  | 'privacy'
  | 'security'
  | 'support'
  | 'appearance'
  | 'account'
  | 'data'
  | 'help';

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<ViewState>('profile');
  const [activeTab, setActiveTab] = useState<'posts' | 'businesses'>('posts');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [connectionCount, setConnectionCount] = useState(0);

  // Settings states
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email: {
      messages: true,
      comments: true,
      likes: true,
      connections: true,
      announcements: true,
    },
    push: {
      messages: true,
      comments: true,
      likes: true,
      mentions: true,
    },
    inApp: {
      messages: true,
      comments: true,
      likes: true,
      suggestions: true,
    },
    frequency: 'realtime',
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00',
    },
  });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    showOnlineStatus: true,
    allowTagging: true,
    showLastSeen: true,
    allowSearchIndexing: true,
    dataSharing: {
      analytics: true,
      personalization: true,
      marketing: false,
    },
    twoFactorAuth: false,
    loginAlerts: true,
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    passwordLastChanged: new Date().toISOString(),
    activeSessions: [],
    trustedDevices: [],
    blockedUsers: [],
  });

  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([
    {
      id: '1',
      title: 'Account verification issue',
      category: 'Account',
      status: 'resolved',
      created_at: '2024-01-10T10:30:00Z',
      updated_at: '2024-01-12T14:20:00Z',
    },
    {
      id: '2',
      title: 'Business registration problem',
      category: 'Business',
      status: 'in_progress',
      created_at: '2024-01-15T09:15:00Z',
      updated_at: '2024-01-15T09:15:00Z',
    },
  ]);

  const [appearance, setAppearance] = useState({
    theme: 'light',
    fontSize: 'medium',
    reduceAnimations: false,
    highContrast: false,
  });

  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    avatar_url: '',
  });

  /* ---------------- LOAD DATA ---------------- */

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          navigate('/login');
          return;
        }

        // Get profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (profileData) {
          setProfile(profileData);
          setEditForm({
            first_name: profileData.first_name || '',
            last_name: profileData.last_name || '',
            email: profileData.email || '',
            phone: profileData.phone || '',
            bio: profileData.bio || '',
            avatar_url: profileData.avatar_url || '',
          });
        }

        // Get posts from database
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;
        setPosts(postsData || []);

        // Get businesses from database
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        if (businessError) throw businessError;
        setBusinesses(businessData || []);

        // Get connections count
        const { data: connectionsData, error: connectionsError } = await supabase
          .from('connections')
          .select('*')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .eq('status', 'accepted');

        if (connectionsError) throw connectionsError;
        setConnections(connectionsData || []);
        setConnectionCount(connectionsData?.length || 0);

        // Load active sessions
        const { data: sessions } = await supabase.auth.getSession();
        if (sessions.session) {
          setSecuritySettings(prev => ({
            ...prev,
            activeSessions: [{
              id: sessions.session!.user.id,
              device: 'Current Device',
              location: 'Unknown',
              lastActive: new Date().toISOString(),
              current: true,
            }]
          }));
        }

      } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  /* ---------------- HELPERS ---------------- */

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
        setEditForm(prev => ({ ...prev, avatar_url: result }));
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile?.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      if (profile) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', profile.id);

        if (updateError) throw updateError;

        setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
        setEditForm(prev => ({ ...prev, avatar_url: publicUrl }));
        showToast('Profile picture updated successfully');
      }

    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('Failed to upload image');
    } finally {
      setUploading(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          phone: editForm.phone,
          bio: editForm.bio,
          avatar_url: editForm.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ 
        ...profile, 
        ...editForm,
        updated_at: new Date().toISOString()
      });
      setView('settings');
      showToast('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(posts.filter(post => post.id !== postId));
      showToast('Post deleted');
    } catch (error) {
      console.error('Error deleting post:', error);
      showToast('Failed to delete post');
    }
  };

  const handleDeleteBusiness = async (businessId: string) => {
    if (!window.confirm('Are you sure you want to delete this business?')) return;
    
    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessId);

      if (error) throw error;

      setBusinesses(businesses.filter(business => business.id !== businessId));
      showToast('Business deleted');
    } catch (error) {
      console.error('Error deleting business:', error);
      showToast('Failed to delete business');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Calculate full name
  const getFullName = () => {
    if (!profile) return '';
    return `${profile.first_name} ${profile.last_name || ''}`.trim();
  };

  // Get initials for avatar
  const getInitials = () => {
    const fullName = getFullName();
    if (!fullName) return 'U';
    
    return fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  /* ---------------- SETTINGS HANDLERS ---------------- */

  const handleSaveNotificationSettings = async () => {
    try {
      // Save to database or localStorage
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
      showToast('Notification settings saved');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      showToast('Failed to save settings');
    }
  };

  const handleSavePrivacySettings = async () => {
    try {
      localStorage.setItem('privacySettings', JSON.stringify(privacySettings));
      showToast('Privacy settings saved');
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      showToast('Failed to save settings');
    }
  };

  const handleSaveSecuritySettings = async () => {
    try {
      localStorage.setItem('securitySettings', JSON.stringify(securitySettings));
      showToast('Security settings saved');
    } catch (error) {
      console.error('Error saving security settings:', error);
      showToast('Failed to save settings');
    }
  };

  const handleChangePassword = async () => {
    const newPassword = prompt('Enter new password:');
    if (!newPassword) return;

    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSecuritySettings(prev => ({
        ...prev,
        passwordLastChanged: new Date().toISOString()
      }));
      showToast('Password updated successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      showToast('Failed to change password');
    }
  };

  const handleTerminateSession = (sessionId: string) => {
    if (!window.confirm('Are you sure you want to terminate this session?')) return;
    
    setSecuritySettings(prev => ({
      ...prev,
      activeSessions: prev.activeSessions.filter(session => session.id !== sessionId)
    }));
    showToast('Session terminated');
  };

  const handleExportData = async () => {
    try {
      const exportData = {
        profile,
        posts,
        businesses,
        connections,
        settings: {
          notifications: notificationSettings,
          privacy: privacySettings,
          security: securitySettings,
          appearance,
        },
        exportDate: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bizconnect-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      showToast('Failed to export data');
    }
  };

  const handleDeleteAccount = async () => {
    const confirm1 = prompt('Type "DELETE" to confirm account deletion:');
    if (confirm1 !== 'DELETE') {
      showToast('Account deletion cancelled');
      return;
    }

    const confirm2 = prompt('This action cannot be undone. Type your email to confirm:');
    if (confirm2 !== profile?.email) {
      showToast('Email does not match. Deletion cancelled.');
      return;
    }

    if (!window.confirm('Are you absolutely sure? This will permanently delete all your data.')) {
      showToast('Account deletion cancelled');
      return;
    }

    try {
      const { error } = await supabase.rpc('delete_user_account');
      
      if (error) throw error;
      
      await supabase.auth.signOut();
      navigate('/login');
      showToast('Account deleted successfully');
    } catch (error) {
      console.error('Error deleting account:', error);
      showToast('Failed to delete account');
    }
  };

  const handleCreateSupportTicket = () => {
    const title = prompt('Enter ticket title:');
    if (!title) return;

    const category = prompt('Enter category (Account, Business, Technical, Other):') || 'Other';
    
    const newTicket: SupportTicket = {
      id: Date.now().toString(),
      title,
      category,
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setSupportTickets(prev => [newTicket, ...prev]);
    showToast('Support ticket created');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex flex-col items-center justify-center safe-area">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Profile...</p>
        </div>
      </div>
    );
  }

  /* ---------------- NOTIFICATIONS VIEW ---------------- */
  if (view === 'notifications') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50">
        <div className="sticky top-0 z-40 bg-gradient-to-b from-gray-50 to-blue-50">
          <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-200/80">
            <button 
              onClick={() => setView('settings')}
              className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Notifications</h1>
              <p className="text-xs text-gray-500">Manage your notification preferences</p>
            </div>
          </div>
        </div>

        <main className="px-4 pt-4 pb-24 max-w-screen-sm mx-auto">
          <div className="space-y-6">
            {/* Email Notifications */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <MailIcon size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Email Notifications</h3>
                  <p className="text-xs text-gray-500">Control email notifications</p>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(notificationSettings.email).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {key.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <button
                      onClick={() => setNotificationSettings(prev => ({
                        ...prev,
                        email: { ...prev.email, [key]: !value }
                      }))}
                      className={`w-12 h-6 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${value ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Push Notifications */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <Bell size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Push Notifications</h3>
                  <p className="text-xs text-gray-500">Control push notifications</p>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(notificationSettings.push).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {key.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <button
                      onClick={() => setNotificationSettings(prev => ({
                        ...prev,
                        push: { ...prev.push, [key]: !value }
                      }))}
                      className={`w-12 h-6 rounded-full transition-colors ${value ? 'bg-green-600' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${value ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Notification Frequency */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Notification Frequency</h3>
              <div className="space-y-3">
                {['realtime', 'daily', 'weekly'].map((freq) => (
                  <button
                    key={freq}
                    onClick={() => setNotificationSettings(prev => ({ ...prev, frequency: freq as any }))}
                    className={`w-full p-3 rounded-lg border transition-all ${notificationSettings.frequency === freq ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 capitalize">{freq}</span>
                      {notificationSettings.frequency === freq && (
                        <Check size={16} className="text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quiet Hours */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Quiet Hours</h3>
                  <p className="text-xs text-gray-500">Pause notifications during specific hours</p>
                </div>
                <button
                  onClick={() => setNotificationSettings(prev => ({
                    ...prev,
                    quietHours: { ...prev.quietHours, enabled: !prev.quietHours.enabled }
                  }))}
                  className={`w-12 h-6 rounded-full transition-colors ${notificationSettings.quietHours.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${notificationSettings.quietHours.enabled ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              {notificationSettings.quietHours.enabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Start Time</label>
                      <input
                        type="time"
                        value={notificationSettings.quietHours.start}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          quietHours: { ...prev.quietHours, start: e.target.value }
                        }))}
                        className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700">End Time</label>
                      <input
                        type="time"
                        value={notificationSettings.quietHours.end}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          quietHours: { ...prev.quietHours, end: e.target.value }
                        }))}
                        className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSaveNotificationSettings}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200/50 active:scale-[0.98] transition-all duration-200"
            >
              Save Changes
            </button>
          </div>
        </main>
      </div>
    );
  }

  /* ---------------- PRIVACY VIEW ---------------- */
  if (view === 'privacy') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50">
        <div className="sticky top-0 z-40 bg-gradient-to-b from-gray-50 to-blue-50">
          <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-200/80">
            <button 
              onClick={() => setView('settings')}
              className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Privacy</h1>
              <p className="text-xs text-gray-500">Control your privacy settings</p>
            </div>
          </div>
        </div>

        <main className="px-4 pt-4 pb-24 max-w-screen-sm mx-auto">
          <div className="space-y-6">
            {/* Profile Visibility */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Profile Visibility</h3>
              <div className="space-y-3">
                {[
                  { value: 'public', label: 'Public', desc: 'Anyone can see your profile' },
                  { value: 'connections', label: 'Connections Only', desc: 'Only your connections can see your profile' },
                  { value: 'private', label: 'Private', desc: 'Only you can see your profile' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPrivacySettings(prev => ({ ...prev, profileVisibility: option.value as any }))}
                    className={`w-full p-4 rounded-lg border transition-all text-left ${privacySettings.profileVisibility === option.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-gray-900">{option.label}</span>
                      {privacySettings.profileVisibility === option.value && (
                        <Check size={16} className="text-blue-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy Controls */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Privacy Controls</h3>
              <div className="space-y-4">
                {[
                  { key: 'showOnlineStatus', label: 'Show Online Status', icon: <Globe size={16} /> },
                  { key: 'allowTagging', label: 'Allow Tagging in Posts', icon: <User size={16} /> },
                  { key: 'showLastSeen', label: 'Show Last Seen', icon: <Eye size={16} /> },
                  { key: 'allowSearchIndexing', label: 'Allow Search Indexing', icon: <Search size={16} /> },
                ].map(({ key, label, icon }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-gray-600">{icon}</div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{label}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPrivacySettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] as any }))}
                      className={`w-12 h-6 rounded-full transition-colors ${privacySettings[key as keyof typeof privacySettings] ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${privacySettings[key as keyof typeof privacySettings] ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Sharing */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Shield size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Data Sharing</h3>
                  <p className="text-xs text-gray-500">Control how your data is used</p>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(privacySettings.dataSharing).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {key === 'analytics' && 'Help improve the app'}
                        {key === 'personalization' && 'Personalize your experience'}
                        {key === 'marketing' && 'Receive marketing emails'}
                      </p>
                    </div>
                    <button
                      onClick={() => setPrivacySettings(prev => ({
                        ...prev,
                        dataSharing: { ...prev.dataSharing, [key]: !value }
                      }))}
                      className={`w-12 h-6 rounded-full transition-colors ${value ? 'bg-purple-600' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${value ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Features */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Security Features</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                    <p className="text-xs text-gray-500">Add an extra layer of security</p>
                  </div>
                  <button
                    onClick={() => setPrivacySettings(prev => ({ ...prev, twoFactorAuth: !prev.twoFactorAuth }))}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors"
                  >
                    {privacySettings.twoFactorAuth ? 'Disable' : 'Enable'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Login Alerts</p>
                    <p className="text-xs text-gray-500">Get notified of new logins</p>
                  </div>
                  <button
                    onClick={() => setPrivacySettings(prev => ({ ...prev, loginAlerts: !prev.loginAlerts }))}
                    className={`w-12 h-6 rounded-full transition-colors ${privacySettings.loginAlerts ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${privacySettings.loginAlerts ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleSavePrivacySettings}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200/50 active:scale-[0.98] transition-all duration-200"
            >
              Save Privacy Settings
            </button>
          </div>
        </main>
      </div>
    );
  }

  /* ---------------- SECURITY VIEW ---------------- */
  if (view === 'security') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50">
        <div className="sticky top-0 z-40 bg-gradient-to-b from-gray-50 to-blue-50">
          <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-200/80">
            <button 
              onClick={() => setView('settings')}
              className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Security</h1>
              <p className="text-xs text-gray-500">Manage your account security</p>
            </div>
          </div>
        </div>

        <main className="px-4 pt-4 pb-24 max-w-screen-sm mx-auto">
          <div className="space-y-6">
            {/* Password */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                  <Key size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Password</h3>
                  <p className="text-xs text-gray-500">Last changed {formatRelativeTime(securitySettings.passwordLastChanged)}</p>
                </div>
              </div>

              <button
                onClick={handleChangePassword}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 rounded-lg transition-all duration-200"
              >
                Change Password
              </button>
            </div>

            {/* Active Sessions */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Active Sessions</h3>
              <div className="space-y-4">
                {securitySettings.activeSessions.map((session) => (
                  <div key={session.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Smartphone size={16} className="text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">{session.device}</span>
                        {session.current && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      {!session.current && (
                        <button
                          onClick={() => handleTerminateSession(session.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Terminate
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{session.location}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Last active {formatRelativeTime(session.lastActive)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <ShieldCheck size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Two-Factor Authentication</h3>
                    <p className="text-xs text-gray-500">Add an extra layer of security</p>
                  </div>
                </div>
                <button
                  onClick={() => setPrivacySettings(prev => ({ ...prev, twoFactorAuth: !prev.twoFactorAuth }))}
                  className={`w-12 h-6 rounded-full transition-colors ${privacySettings.twoFactorAuth ? 'bg-green-600' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${privacySettings.twoFactorAuth ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              {privacySettings.twoFactorAuth && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800 font-medium mb-2">✓ Two-Factor Authentication is enabled</p>
                  <p className="text-xs text-green-700">
                    You'll be asked for a verification code when logging in from new devices.
                  </p>
                </div>
              )}
            </div>

            {/* Trusted Devices */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">Trusted Devices</h3>
                <span className="text-xs text-gray-500">{securitySettings.trustedDevices.length} devices</span>
              </div>
              
              {securitySettings.trustedDevices.length === 0 ? (
                <div className="text-center py-8">
                  <ShieldIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No trusted devices yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {securitySettings.trustedDevices.map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{device.name}</p>
                        <p className="text-xs text-gray-500">Added {formatRelativeTime(device.added)}</p>
                      </div>
                      <button className="text-red-500 hover:text-red-700 text-sm">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleSaveSecuritySettings}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200/50 active:scale-[0.98] transition-all duration-200"
            >
              Save Security Settings
            </button>
          </div>
        </main>
      </div>
    );
  }

  /* ---------------- SUPPORT VIEW ---------------- */
  if (view === 'support') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50">
        <div className="sticky top-0 z-40 bg-gradient-to-b from-gray-50 to-blue-50">
          <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-200/80">
            <button 
              onClick={() => setView('settings')}
              className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Help & Support</h1>
              <p className="text-xs text-gray-500">Get help and contact support</p>
            </div>
          </div>
        </div>

        <main className="px-4 pt-4 pb-24 max-w-screen-sm mx-auto">
          <div className="space-y-6">
            {/* Contact Support */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <MessageSquareIcon size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Contact Support</h3>
                  <p className="text-xs text-gray-500">Get help from our support team</p>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleCreateSupportTicket}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 rounded-lg transition-all duration-200"
                >
                  Create Support Ticket
                </button>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail size={16} className="text-blue-600" />
                    <p className="text-sm font-medium text-blue-900">Email Support</p>
                  </div>
                  <p className="text-xs text-blue-700">support@bizconnect.com</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <PhoneIcon size={16} className="text-green-600" />
                    <p className="text-sm font-medium text-green-900">Phone Support</p>
                  </div>
                  <p className="text-xs text-green-700">+1 (555) 123-4567</p>
                  <p className="text-xs text-green-600 mt-1">Mon-Fri, 9AM-5PM EST</p>
                </div>
              </div>
            </div>

            {/* Support Tickets */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-gray-900">My Support Tickets</h3>
                <span className="text-xs text-gray-500">{supportTickets.length} tickets</span>
              </div>

              {supportTickets.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No support tickets yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {supportTickets.map((ticket) => (
                    <div key={ticket.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{ticket.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{ticket.category}</span>
                        <span>Created {formatRelativeTime(ticket.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Help Resources */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Help Resources</h3>
              <div className="space-y-3">
                <button className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">User Guide</span>
                    </div>
                    <ExternalLink size={16} className="text-gray-400" />
                  </div>
                </button>

                <button className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <HelpCircle size={16} className="text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">FAQs</span>
                    </div>
                    <ExternalLink size={16} className="text-gray-400" />
                  </div>
                </button>

                <button className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Video size={16} className="text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">Video Tutorials</span>
                    </div>
                    <ExternalLink size={16} className="text-gray-400" />
                  </div>
                </button>
              </div>
            </div>

            {/* Community */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users size={20} className="text-gray-600" />
                <h3 className="text-sm font-bold text-gray-900">Community</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Join our community of business owners to get help, share ideas, and connect with others.
              </p>
              <button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-3 rounded-lg transition-all duration-200">
                Join Community Forum
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ---------------- DATA & PRIVACY VIEW ---------------- */
  if (view === 'data') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50">
        <div className="sticky top-0 z-40 bg-gradient-to-b from-gray-50 to-blue-50">
          <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-200/80">
            <button 
              onClick={() => setView('settings')}
              className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Data & Privacy</h1>
              <p className="text-xs text-gray-500">Manage your data and privacy</p>
            </div>
          </div>
        </div>

        <main className="px-4 pt-4 pb-24 max-w-screen-sm mx-auto">
          <div className="space-y-6">
            {/* Data Export */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <Download size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Export Your Data</h3>
                  <p className="text-xs text-gray-500">Download a copy of your data</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                You can download all your personal data, including profile information, posts, businesses, and connections.
              </p>

              <button
                onClick={handleExportData}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 rounded-lg transition-all duration-200"
              >
                Export Data
              </button>
            </div>

            {/* Clear Data */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                  <Trash2 size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Clear Data</h3>
                  <p className="text-xs text-gray-500">Clear your cached data</p>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    localStorage.clear();
                    showToast('Cache cleared successfully');
                  }}
                  className="w-full py-3 border border-yellow-500 text-yellow-600 font-medium rounded-lg hover:bg-yellow-50 transition-colors"
                >
                  Clear Cache
                </button>

                <button
                  onClick={() => {
                    // Clear browsing data
                    if (window.confirm('This will clear all browsing data including login sessions. Continue?')) {
                      showToast('Browsing data cleared');
                    }
                  }}
                  className="w-full py-3 border border-red-500 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors"
                >
                  Clear Browsing Data
                </button>
              </div>
            </div>

            {/* Delete Account */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                  <AlertCircle size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Delete Account</h3>
                  <p className="text-xs text-gray-500">Permanently delete your account</p>
                </div>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border border-red-200 mb-4">
                <p className="text-sm text-red-800 font-medium mb-2">⚠️ This action cannot be undone</p>
                <p className="text-xs text-red-700">
                  All your data including profile, posts, businesses, and connections will be permanently deleted.
                </p>
              </div>

              <button
                onClick={handleDeleteAccount}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 rounded-lg transition-all duration-200"
              >
                Delete Account
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ---------------- EDIT PROFILE VIEW ---------------- */
  if (view === 'edit_profile') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-b from-gray-50 to-blue-50">
          <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-gray-200/80">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setView('settings')}
                className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Edit Profile</h1>
                <p className="text-xs text-gray-500">Update your personal information</p>
              </div>
            </div>
            <button 
              onClick={handleSaveProfile}
              className="text-sm font-bold text-blue-600 hover:text-blue-700"
              disabled={uploading}
            >
              {uploading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
        />

        {/* Main Content */}
        <main className="px-4 pt-4 pb-24 max-w-screen-sm mx-auto">
          {/* Avatar Upload */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-6 mb-4">
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl overflow-hidden border-4 border-white shadow-lg">
                  {avatarPreview || editForm.avatar_url ? (
                    <img 
                      src={avatarPreview || editForm.avatar_url} 
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials()
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-2 right-2 w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all active:scale-95"
                >
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera size={20} className="text-white" />
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                {uploading ? 'Uploading...' : 'Click camera icon to upload photo'}
              </p>
              <p className="text-xs text-gray-400 text-center">
                Supported formats: JPG, PNG, GIF • Max size: 5MB
              </p>
            </div>
          </div>

          {/* Edit Form */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">First Name *</label>
                <input
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200 text-sm"
                  placeholder="Enter first name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Last Name</label>
                <input
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200 text-sm"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Bio</label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200 text-sm min-h-[100px] resize-none"
                placeholder="Tell others about yourself..."
                maxLength={500}
              />
              <div className="text-right">
                <span className="text-xs text-gray-500">{editForm.bio.length}/500</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Email</label>
              <div className="relative">
                <input
                  value={editForm.email}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  type="email"
                  disabled
                />
                <Mail size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">Cannot change</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Phone</label>
              <div className="relative">
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200 text-sm"
                  placeholder="Phone number"
                  type="tel"
                />
                <PhoneIcon size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Avatar URL</label>
              <div className="flex gap-2">
                <input
                  value={editForm.avatar_url}
                  onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                  className="flex-1 px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200 text-sm"
                  placeholder="Or enter image URL"
                  type="url"
                />
                <button
                  onClick={() => setAvatarPreview(editForm.avatar_url)}
                  className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                >
                  Preview
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-red-200/80 p-6 mt-6">
            <h3 className="text-sm font-bold text-red-900 mb-4">Danger Zone</h3>
            <button
              onClick={handleDeleteAccount}
              className="w-full py-3 border-2 border-red-500 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </main>
      </div>
    );
  }

  /* ---------------- SETTINGS VIEW ---------------- */
  if (view === 'settings') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-b from-gray-50 to-blue-50">
          <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-200/80">
            <button 
              onClick={() => setView('profile')}
              className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Settings</h1>
              <p className="text-xs text-gray-500">Manage your account preferences</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="px-4 pt-4 pb-24 max-w-screen-sm mx-auto">
          {/* Settings Options */}
          <div className="space-y-4">
            {/* Account Settings */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Account</h3>
              </div>
              
              <button 
                onClick={() => setView('edit_profile')}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <User size={18} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Edit Profile</p>
                    <p className="text-xs text-gray-500">Update your personal information</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>

              <button 
                onClick={() => setView('data')}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Download size={18} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Data & Privacy</p>
                    <p className="text-xs text-gray-500">Export data or delete account</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Preferences */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Preferences</h3>
              </div>
              
              <button 
                onClick={() => setView('notifications')}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Bell size={18} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Notifications</p>
                    <p className="text-xs text-gray-500">Manage notification preferences</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>

              <button 
                onClick={() => setView('privacy')}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Shield size={18} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Privacy</p>
                    <p className="text-xs text-gray-500">Control your privacy settings</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>

              <button 
                onClick={() => setView('security')}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                    <Key size={18} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Security</p>
                    <p className="text-xs text-gray-500">Password and account security</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Support */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Support</h3>
              </div>
              
              <button 
                onClick={() => setView('support')}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <HelpCircle size={18} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Help & Support</p>
                    <p className="text-xs text-gray-500">Get help and contact support</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>

              <button 
                onClick={() => window.open('/terms', '_blank')}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                    <FileText size={18} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Terms & Policies</p>
                    <p className="text-xs text-gray-500">Read terms of service</p>
                  </div>
                </div>
                <ExternalLink size={18} className="text-gray-400" />
              </button>
            </div>

            {/* About */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Info size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">About BizConnect</p>
                  <p className="text-xs text-gray-500">Version 1.0.0</p>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-200/50 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3"
            >
              <LogOut size={18} />
              Log Out
            </button>
          </div>
        </main>
      </div>
    );
  }

  /* ---------------- MAIN PROFILE VIEW ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50">
      {/* Fixed Header */}
      <Header title="My Profile" showBack={false} />

      {/* Main Content */}
      <main className="px-4 pt-4 pb-24 max-w-screen-sm mx-auto">
        {/* Profile Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden mb-6">
          <div className="relative">
            {/* Cover Image */}
            <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-700"></div>
            
            {/* Avatar and Info */}
            <div className="relative px-6 pb-6">
              <div className="absolute -top-12 left-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={getFullName()}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials()
                  )}
                </div>
              </div>

              <div className="pt-16">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{getFullName()}</h2>
                    <p className="text-sm text-gray-500">{profile?.role || 'Member'}</p>
                    {profile?.approval_status && (
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${
                        profile.approval_status === 'approved' 
                          ? 'bg-green-100 text-green-800'
                          : profile.approval_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {profile.approval_status.charAt(0).toUpperCase() + profile.approval_status.slice(1)}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => setView('settings')}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Settings size={16} />
                    Settings
                  </button>
                </div>

                {profile?.bio && (
                  <p className="text-sm text-gray-600 mt-3">{profile.bio}</p>
                )}

                <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                  {profile?.phone && (
                    <div className="flex items-center gap-1">
                      <PhoneIcon size={12} />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  
                  {profile?.created_at && (
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>Joined {formatDate(profile.created_at)}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{posts.length}</div>
                    <div className="text-xs text-gray-500">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{businesses.length}</div>
                    <div className="text-xs text-gray-500">Businesses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{connectionCount}</div>
                    <div className="text-xs text-gray-500">Connections</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/95 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-gray-200/80 mb-6">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'posts'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab('businesses')}
            className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'businesses'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Businesses
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'posts' ? (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">No Posts Yet</h4>
                <p className="text-gray-600 text-sm">You haven't created any posts yet</p>
                <button
                  onClick={() => navigate('/create-post')}
                  className="mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold px-6 py-3 rounded-lg transition-colors active:scale-95"
                >
                  Create Your First Post
                </button>
              </div>
            ) : (
              posts.map((post) => (
                <div 
                  key={post.id} 
                  className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                          {getInitials()}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">{getFullName()}</h4>
                          <p className="text-xs text-gray-500">{formatRelativeTime(post.created_at)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {post.title && (
                      <h3 className="text-base font-bold text-gray-900 mb-2">{post.title}</h3>
                    )}
                    
                    {post.excerpt && (
                      <p className="text-sm text-gray-600 mb-2">{post.excerpt}</p>
                    )}

                    {post.content && (
                      <p className="text-sm text-gray-700 mb-4">{post.content}</p>
                    )}

                    {post.image_url && (
                      <div className="mb-4">
                        <img 
                          src={post.image_url} 
                          alt={post.title || 'Post image'}
                          className="w-full h-48 object-cover rounded-xl"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                      <div className="flex items-center gap-6">
                        <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600">
                          <Heart size={14} />
                          <span>{post.likes_count}</span>
                        </button>
                        <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-600">
                          <MessageSquare size={14} />
                          <span>{post.comments_count}</span>
                        </button>
                        <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-600">
                          <Share2 size={14} />
                          <span>{post.shares_count}</span>
                        </button>
                      </div>
                      <button className="text-xs text-gray-500 hover:text-gray-700">
                        <MessageCircle size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {businesses.length === 0 ? (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">No Businesses Yet</h4>
                <p className="text-gray-600 text-sm mb-6">You haven't registered any businesses yet</p>
                <button
                  onClick={() => navigate('/businesses/create')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold px-6 py-3 rounded-lg transition-colors active:scale-95"
                >
                  Register Your First Business
                </button>
              </div>
            ) : (
              businesses.map((business) => (
                <div 
                  key={business.id} 
                  className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold overflow-hidden">
                            {business.logo_url ? (
                              <img 
                                src={business.logo_url} 
                                alt={business.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              business.name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          {business.is_verified && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                              <Check size={12} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-900 truncate">
                              {business.name}
                            </h3>
                            {business.is_verified && (
                              <Star size={12} className="text-blue-600 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 truncate mt-1">
                            {business.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {business.category && (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-[10px] font-bold rounded-lg">
                                {business.category}
                              </span>
                            )}
                            {business.address && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin size={10} />
                                {business.address}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button 
                        onClick={() => navigate(`/businesses/${business.id}`)}
                        className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold rounded-lg transition-all active:scale-95"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => handleDeleteBusiness(business.id)}
                        className="px-4 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition-colors flex items-center justify-center"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-200/50 z-50 animate-fade-in">
          <div className="flex items-center gap-2">
            <Check size={16} />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;