import React from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function MoneyScreen() {
  const dummyTransactions = [
    { id: '1', desc: 'Acme Invoice Payment', amount: '+$5,400.00', date: 'May 28', type: 'inflow' },
    { id: '2', desc: 'Figma Pro Subscription', amount: '-$15.00', date: 'May 26', type: 'outflow' },
    { id: '3', desc: 'Office Rent & Utilities', amount: '-$1,200.00', date: 'May 25', type: 'outflow' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView className="flex-1 px-5 pt-4">
        {/* Screen Header */}
        <View className="mb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-black text-white">Money</Text>
            <Text className="text-xs text-slate-400 mt-1">Reconciliation, cashflow & corporate invoices</Text>
          </View>
          <TouchableOpacity className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl items-center justify-center active:opacity-75">
            <Feather name="plus" size={20} color="#818cf8" />
          </TouchableOpacity>
        </View>

        {/* Cashflow widgets */}
        <View className="flex-row justify-between mb-6 gap-3">
          <View className="flex-1 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            <Text className="text-[10px] font-bold text-slate-500 uppercase">Cash In</Text>
            <Text className="text-lg font-black text-emerald-400 mt-1">+$42.3K</Text>
          </View>
          <View className="flex-1 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            <Text className="text-[10px] font-bold text-slate-500 uppercase">Cash Out</Text>
            <Text className="text-lg font-black text-rose-500 mt-1">-$8.1K</Text>
          </View>
        </View>

        {/* Transaction History */}
        <View className="space-y-3">
          <Text className="text-sm font-extrabold text-slate-300 mb-3">Reconciliation Ledger</Text>
          {dummyTransactions.map((tx) => (
            <View 
              key={tx.id}
              className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 flex-row items-center justify-between mb-2.5"
            >
              <View className="flex-row items-center flex-1 pr-3">
                <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3.5 ${
                  tx.type === 'inflow' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                }`}>
                  <Feather 
                    name={tx.type === 'inflow' ? 'arrow-down-left' : 'arrow-up-right'} 
                    size={16} 
                    color={tx.type === 'inflow' ? '#10b981' : '#f43f5e'} 
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-200" numberOfLines={1}>{tx.desc}</Text>
                  <Text className="text-[10px] text-slate-400 mt-0.5">{tx.date}</Text>
                </View>
              </View>
              <Text className={`text-xs font-black ${
                tx.type === 'inflow' ? 'text-emerald-400' : 'text-rose-400'
              }`}>{tx.amount}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
