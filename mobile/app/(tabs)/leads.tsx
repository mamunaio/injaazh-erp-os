import React from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function LeadsScreen() {
  const dummyLeads = [
    { id: '1', name: 'Acme Corp', value: '$12,500', stage: 'Proposal', status: 'hot', icon: 'file-text' as const },
    { id: '2', name: 'Zylotech Inc', value: '$8,400', stage: 'Contacted', status: 'warm', icon: 'phone-call' as const },
    { id: '3', name: 'Pixelcraft Studio', value: '$15,000', stage: 'Negotiation', status: 'hot', icon: 'message-circle' as const },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView className="flex-1 px-5 pt-4">
        {/* Screen Header */}
        <View className="mb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-black text-white">Leads</Text>
            <Text className="text-xs text-slate-400 mt-1">Manage and track agency sales pipelines</Text>
          </View>
          <TouchableOpacity className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl items-center justify-center active:opacity-75">
            <Feather name="plus" size={20} color="#818cf8" />
          </TouchableOpacity>
        </View>

        {/* Quick Summary Widgets */}
        <View className="flex-row justify-between mb-6 gap-3">
          <View className="flex-1 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            <Text className="text-[10px] font-bold text-slate-500 uppercase">Active Leads</Text>
            <Text className="text-xl font-black text-slate-100 mt-1">24</Text>
          </View>
          <View className="flex-1 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            <Text className="text-[10px] font-bold text-slate-500 uppercase">Value</Text>
            <Text className="text-xl font-black text-emerald-400 mt-1">$35.9K</Text>
          </View>
        </View>

        {/* Pipeline List */}
        <View className="space-y-3">
          <Text className="text-sm font-extrabold text-slate-300 mb-3">Sales Pipeline</Text>
          {dummyLeads.map((lead) => (
            <View 
              key={lead.id}
              className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 flex-row items-center justify-between mb-2.5"
            >
              <View className="flex-row items-center flex-1 pr-3">
                <View className="w-10 h-10 rounded-xl bg-slate-800/50 items-center justify-center mr-3.5">
                  <Feather name={lead.icon} size={16} color="#94a3b8" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-200">{lead.name}</Text>
                  <Text className="text-[10px] text-slate-400 mt-0.5">{lead.stage}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-xs font-extrabold text-slate-100">{lead.value}</Text>
                <View className={`px-2 py-0.5 rounded-full mt-1.5 ${
                  lead.status === 'hot' ? 'bg-rose-500/10' : 'bg-amber-500/10'
                }`}>
                  <Text className={`text-[8px] font-black uppercase ${
                    lead.status === 'hot' ? 'text-rose-400' : 'text-amber-400'
                  }`}>{lead.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
