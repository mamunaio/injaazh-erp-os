import React, { useEffect, useState, useRef } from 'react';
import { 
  SafeAreaView, 
  ScrollView, 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions,
  Animated,
  ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.42;

// Standard fallback IP. Users should set EXPO_PUBLIC_API_URL in their mobile/.env file
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:3000';

interface ActivityItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  icon: any;
  color: string;
  amount: string | null;
}

interface DashboardData {
  totalLeads: number;
  activeProjects: number;
  totalIncome: string;
  recentActivity: ActivityItem[];
}

// Sleek Pulsing Skeleton Wrapper using Native Animated API
function PulseView({ className, style, children }: { className?: string; style?: any; children?: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.75,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View style={[{ opacity }, style]} className={className}>
      {children}
    </Animated.View>
  );
}

export default function MobileDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/mobile/dashboard`);
      const json = await response.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Failed to fetch dashboard data');
      }
    } catch (err: any) {
      console.error(err);
      setError('Could not connect to the backend server. Verify API_BASE_URL and network.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = [
    { 
      title: 'Total Income', 
      value: data?.totalIncome || '$0', 
      change: 'All Time', 
      icon: 'dollar-sign' as const, 
      color: '#10b981',
      badge: 'bg-emerald-500/10 text-emerald-400' 
    },
    { 
      title: 'Active Projects', 
      value: data ? String(data.activeProjects) : '0', 
      change: 'In Progress', 
      icon: 'briefcase' as const, 
      color: '#3b82f6',
      badge: 'bg-blue-500/10 text-blue-400' 
    },
    { 
      title: 'Active Leads', 
      value: data ? String(data.totalLeads) : '0', 
      change: 'Outreach', 
      icon: 'users' as const, 
      color: '#f59e0b',
      badge: 'bg-amber-500/10 text-amber-400' 
    },
    { 
      title: 'System Health', 
      value: '100%', 
      change: 'Operational', 
      icon: 'heart' as const, 
      color: '#a855f7',
      badge: 'bg-purple-500/10 text-purple-400' 
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity className="p-2 bg-slate-900/80 border border-slate-800 rounded-xl active:opacity-75">
            <Feather name="menu" size={20} color="#cbd5e1" />
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-black tracking-tight text-slate-200">
              INJAAZH
            </Text>
            <Text className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase">
              GLOBAL ERP
            </Text>
          </View>
        </View>
        
        <View className="flex-row items-center gap-2">
          <TouchableOpacity 
            onPress={fetchDashboardData}
            className="p-2 bg-slate-900/80 border border-slate-800 rounded-xl active:opacity-75"
          >
            <Feather name="refresh-cw" size={16} color="#cbd5e1" className={isLoading ? 'animate-spin' : ''} />
          </TouchableOpacity>
          <TouchableOpacity className="p-2 bg-slate-900/80 border border-slate-800 rounded-xl relative active:opacity-75">
            <Feather name="bell" size={18} color="#cbd5e1" />
            <View className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-slate-950" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-5" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* Welcome Section */}
        <View className="my-5">
          <Text className="text-2xl font-black text-white">Dashboard</Text>
          <Text className="text-xs text-slate-400 mt-1 font-medium">Hello, Admin. Here is your enterprise summary.</Text>
        </View>

        {/* Error State View */}
        {error && (
          <View className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 mb-6">
            <View className="flex-row items-center gap-2 mb-2">
              <Feather name="alert-triangle" size={18} color="#f43f5e" />
              <Text className="text-sm font-bold text-rose-400">Connection Error</Text>
            </View>
            <Text className="text-xs text-slate-400 leading-5 mb-3">{error}</Text>
            <TouchableOpacity 
              onPress={fetchDashboardData}
              className="bg-rose-500/20 border border-rose-500/30 rounded-xl py-2 px-4 self-start active:opacity-75"
            >
              <Text className="text-xs font-bold text-rose-300">Retry Connection</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Top Stat Cards Section */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm font-extrabold text-slate-300">Core Metrics</Text>
            <Text className="text-xs font-bold text-indigo-400">View All</Text>
          </View>

          {isLoading ? (
            /* Skeleton Loading for horizontal stats */
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row -mx-5 px-5">
              {[1, 2, 3, 4].map((i) => (
                <View 
                  key={i} 
                  style={{ width: CARD_WIDTH }}
                  className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 mr-4 flex-col justify-between"
                >
                  <View className="flex-row justify-between items-center mb-6">
                    <PulseView className="w-8 h-8 rounded-lg bg-slate-800" />
                    <PulseView className="w-10 h-4 rounded-full bg-slate-800" />
                  </View>
                  <View className="space-y-2">
                    <PulseView className="w-16 h-3 rounded bg-slate-800" />
                    <PulseView className="w-24 h-6 rounded mt-1 bg-slate-800" />
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            /* Stats success UI */
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              className="flex-row -mx-5 px-5"
            >
              {stats.map((stat, index) => (
                <View 
                  key={index}
                  style={{ width: CARD_WIDTH }}
                  className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 mr-4 flex-col justify-between"
                >
                  <View className="flex-row justify-between items-center mb-4">
                    <View 
                      style={{ backgroundColor: `${stat.color}15` }} 
                      className="p-2 rounded-xl"
                    >
                      <Feather name={stat.icon} size={16} color={stat.color} />
                    </View>
                    <View className={`px-2 py-0.5 rounded-full ${stat.badge}`}>
                      <Text className="text-[9px] font-black">{stat.change}</Text>
                    </View>
                  </View>
                  <View>
                    <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.title}</Text>
                    <Text className="text-xl font-black text-slate-100 mt-1">{stat.value}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Quick Actions Grid */}
        <View className="mb-6">
          <Text className="text-sm font-extrabold text-slate-300 mb-3">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between gap-2.5">
            {[
              { label: 'Add Lead', icon: 'user-plus' as const, bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' },
              { label: 'Log Expense', icon: 'dollar-sign' as const, bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400' },
              { label: 'Create Project', icon: 'folder-plus' as const, bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
              { label: 'Reports', icon: 'file-text' as const, bg: 'bg-teal-500/10 border-teal-500/20 text-teal-400' }
            ].map((action, i) => (
              <TouchableOpacity 
                key={i} 
                style={{ width: '48%' }}
                className={`flex-row items-center gap-3 p-3.5 border rounded-xl active:opacity-75 ${action.bg.split(' ')[0]} ${action.bg.split(' ')[1]}`}
              >
                <Feather name={action.icon} size={16} className={action.bg.split(' ')[2]} />
                <Text className={`text-xs font-bold ${action.bg.split(' ')[2]}`}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity List */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm font-extrabold text-slate-300">Recent Activity</Text>
            <TouchableOpacity className="active:opacity-75">
              <Text className="text-xs font-bold text-indigo-400">See History</Text>
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            /* Skeleton Loading list */
            <View className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <View 
                  key={i}
                  className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-4 flex-row items-center justify-between mb-2.5"
                >
                  <View className="flex-row items-center flex-1">
                    <PulseView className="w-10 h-10 rounded-xl bg-slate-800 mr-3.5" />
                    <View className="flex-1 space-y-2">
                      <PulseView className="w-36 h-3 rounded bg-slate-800" />
                      <PulseView className="w-48 h-2 rounded.5 bg-slate-800 mt-1.5" />
                    </View>
                  </View>
                  <View className="items-end space-y-1">
                    <PulseView className="w-12 h-3 rounded bg-slate-800" />
                    <PulseView className="w-8 h-2.5 rounded mt-1 bg-slate-800" />
                  </View>
                </View>
              ))}
            </View>
          ) : data && data.recentActivity && data.recentActivity.length > 0 ? (
            /* Success UI list */
            <View className="space-y-2.5">
              {data.recentActivity.map((act) => (
                <View 
                  key={act.id}
                  className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-4 flex-row items-center justify-between mb-2.5"
                >
                  <View className="flex-row items-center flex-1 pr-3">
                    <View 
                      style={{ backgroundColor: `${act.color}12` }}
                      className="w-10 h-10 rounded-xl items-center justify-center mr-3.5"
                    >
                      <Feather name={act.icon} size={16} color={act.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-slate-200" numberOfLines={1}>
                        {act.title}
                      </Text>
                      <Text className="text-[10px] text-slate-400 mt-0.5" numberOfLines={1}>
                        {act.desc}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    {act.amount ? (
                      <Text 
                        style={{ color: act.amount.startsWith('+') ? '#10b981' : '#f43f5e' }}
                        className="text-xs font-extrabold"
                      >
                        {act.amount}
                      </Text>
                    ) : null}
                    <Text className="text-[9px] font-bold text-slate-500 mt-1">{act.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            /* Empty State */
            <View className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-6 items-center justify-center">
              <Feather name="inbox" size={24} color="#64748b" />
              <Text className="text-xs text-slate-400 mt-2">No recent activity found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
