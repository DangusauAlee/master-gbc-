import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { 
  Search, 
  Users, 
  UserCheck, 
  Building, 
  MapPin, 
  ChevronRight,
  UserPlus,
  Shield,
  X,
  Loader2,
  Briefcase,
  Calendar,
  User
} from 'lucide-react';
import { supabase } from '../services/supabase';

type Member = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  business_name?: string;
  position?: string;
  category?: string;
  location?: string;
  bio?: string;
  role: string;
  approval_status: string;
  payment_verified?: boolean;
  created_at: string;
  is_friend?: boolean;
  connection_status?: 'pending' | 'accepted' | 'rejected';
};

const Members = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'myNetwork'>('all');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
          return;
        }

        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!profile) {
          navigate('/login');
          return;
        }

        setUserProfile(profile);

        // Fetch members
        await fetchMembers(profile.id);
        
      } catch (error) {
        console.error('Error initializing:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [navigate]);

  const fetchMembers = async (currentUserId: string) => {
    try {
      // Fetch all approved profiles except current user
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('approval_status', 'approved')
        .neq('id', currentUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching members:', error);
        return;
      }

      // Fetch connections to determine friend status
      const { data: connections } = await supabase
        .from('connections')
        .select('*')
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

      // Enrich profiles with connection status
      const enrichedMembers = profiles.map(profile => {
        const connection = connections?.find(conn => 
          (conn.user_id === currentUserId && conn.friend_id === profile.id) ||
          (conn.friend_id === currentUserId && conn.user_id === profile.id)
        );

        return {
          ...profile,
          is_friend: connection?.status === 'accepted',
          connection_status: connection?.status
        };
      });

      setMembers(enrichedMembers);
      setFilteredMembers(enrichedMembers);

    } catch (error) {
      console.error('Error in fetchMembers:', error);
    }
  };

  // Filter members based on search and tab
  useEffect(() => {
    let result = members;

    // Filter by active tab
    if (activeTab === 'myNetwork') {
      result = result.filter(member => member.is_friend);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(member => 
        member.first_name?.toLowerCase().includes(term) ||
        member.last_name?.toLowerCase().includes(term) ||
        member.email?.toLowerCase().includes(term) ||
        member.business_name?.toLowerCase().includes(term) ||
        member.position?.toLowerCase().includes(term) ||
        member.location?.toLowerCase().includes(term)
      );
    }

    setFilteredMembers(result);
  }, [searchTerm, activeTab, members]);

  const handleConnect = async (memberId: string) => {
    if (!userProfile) return;

    try {
      const { error } = await supabase
        .from('connections')
        .insert({
          user_id: userProfile.id,
          friend_id: memberId,
          status: 'pending'
        });

      if (error) throw error;

      // Send notification
      await supabase
        .from('notifications')
        .insert({
          user_id: memberId,
          type: 'connection_request',
          actor_id: userProfile.id,
          content: `${userProfile.first_name} sent you a connection request`,
          is_read: false
        });

      // Update local state
      setMembers(prev => prev.map(member => 
        member.id === memberId 
          ? { ...member, connection_status: 'pending' }
          : member
      ));

      // Show success message
      const member = members.find(m => m.id === memberId);
      alert(`Connection request sent to ${member?.first_name} ${member?.last_name}`);

    } catch (error) {
      console.error('Error sending connection request:', error);
      alert('Failed to send connection request');
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex flex-col items-center justify-center safe-area">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Members...</p>
          <p className="text-gray-400 text-sm mt-2">Connecting to database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 safe-area pb-20">
      {/* HEADER */}
      <Header title="Members Directory" showBack={false} />

      {/* MAIN CONTENT */}
      <main className="px-4 pt-4 pb-24 max-w-screen-sm mx-auto">
        {/* SEARCH */}
        <div className="mb-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-4">
            {/* Search Bar */}
            <div className="relative group">
              <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                <Search className="text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
              </div>
              <input
                type="text"
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                placeholder="Search members, companies, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                <Users size={16} />
                All Members
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {members.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('myNetwork')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'myNetwork'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                <UserCheck size={16} />
                My Network
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {members.filter(m => m.is_friend).length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* MEMBERS STATS */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-600/10 to-blue-500/10 backdrop-blur-sm rounded-2xl border border-blue-200/50 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/80 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">{members.length}</div>
                <div className="text-xs text-gray-600">Total Members</div>
              </div>
              <div className="bg-white/80 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {members.filter(m => m.is_friend).length}
                </div>
                <div className="text-xs text-gray-600">In My Network</div>
              </div>
            </div>
          </div>
        </div>

        {/* MEMBERS LIST */}
        <div>
          {filteredMembers.length === 0 ? (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {activeTab === 'all' ? (
                  <Users className="w-8 h-8 text-blue-600" />
                ) : (
                  <UserCheck className="w-8 h-8 text-blue-600" />
                )}
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                {activeTab === 'all' ? 'No Members Found' : 'No Members in Your Network'}
              </h4>
              <p className="text-gray-600 text-sm mb-6">
                {searchTerm
                  ? 'Try adjusting your search'
                  : activeTab === 'all'
                  ? 'No members available in the directory'
                  : 'Connect with members to build your network'}
              </p>
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-6 py-3 rounded-lg transition-colors active:scale-95"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMembers.map(member => (
                <div 
                  key={member.id}
                  className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Member Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                            {member.avatar_url ? (
                              <img 
                                src={member.avatar_url} 
                                alt={`${member.first_name} ${member.last_name}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase()
                            )}
                          </div>
                          {member.payment_verified && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                              <Shield size={10} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-900 truncate">
                              {member.first_name} {member.last_name}
                            </h3>
                            {member.role === 'admin' && (
                              <span className="px-1.5 py-0.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs rounded-full">
                                Admin
                              </span>
                            )}
                          </div>
                          {member.position && (
                            <p className="text-xs text-gray-600 truncate mt-1">
                              {member.position}
                            </p>
                          )}
                          {member.business_name && (
                            <p className="text-xs text-gray-500 truncate mt-0.5 flex items-center gap-1">
                              <Building size={10} />
                              {member.business_name}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Connection Status */}
                      <div className="flex-shrink-0 ml-2">
                        {member.connection_status === 'accepted' ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-lg">
                            Connected
                          </span>
                        ) : member.connection_status === 'pending' ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-lg">
                            Pending
                          </span>
                        ) : (
                          <button
                            onClick={() => handleConnect(member.id)}
                            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-bold rounded-lg transition-all active:scale-95 flex items-center gap-1"
                          >
                            <UserPlus size={12} />
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Member Details */}
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    <div className="space-y-2">
                      {member.location && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <MapPin size={12} />
                          <span>{member.location}</span>
                        </div>
                      )}
                      
                      {member.category && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Briefcase size={12} />
                          <span>{member.category}</span>
                        </div>
                      )}
                      
                      {member.bio && (
                        <div className="flex items-start gap-2 text-xs text-gray-600 mt-2">
                          <User size={12} className="mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{member.bio}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                        <Calendar size={12} />
                        <span>Joined {formatDate(member.created_at)}</span>
                      </div>
                    </div>

                    {/* View Profile Button */}
                    <button
                      onClick={() => navigate(`/member/${member.id}`)}
                      className="w-full mt-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      View Full Profile
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* BOTTOM NAV */}
      <BottomNav />
    </div>
  );
};

export default Members;