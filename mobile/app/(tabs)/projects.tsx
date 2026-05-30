import React from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function ProjectsScreen() {
  const dummyProjects = [
    { id: '1', title: 'Injaazh ERP Launch', progress: 0.85, client: 'Internal Project', date: 'Due June 10' },
    { id: '2', title: 'Agency Website Redesign', progress: 0.4, client: 'Aether Media', date: 'Due June 24' },
    { id: '3', title: 'MongoDB API Integration', progress: 1.0, client: 'Client Project', date: 'Completed' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView className="flex-1 px-5 pt-4">
        {/* Screen Header */}
        <View className="mb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-black text-white">Projects</Text>
            <Text className="text-xs text-slate-400 mt-1">Track deliverables, progress & milestones</Text>
          </View>
          <TouchableOpacity className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl items-center justify-center active:opacity-75">
            <Feather name="plus" size={20} color="#818cf8" />
          </TouchableOpacity>
        </View>

        {/* Project Pipeline Summary */}
        <View className="flex-row justify-between mb-6 gap-3">
          <View className="flex-1 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            <Text className="text-[10px] font-bold text-slate-500 uppercase">In Progress</Text>
            <Text className="text-xl font-black text-blue-400 mt-1">12 Projects</Text>
          </View>
          <View className="flex-1 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            <Text className="text-[10px] font-bold text-slate-500 uppercase">Completed</Text>
            <Text className="text-xl font-black text-emerald-400 mt-1">45 Done</Text>
          </View>
        </View>

        {/* Project List */}
        <View className="space-y-4">
          <Text className="text-sm font-extrabold text-slate-300 mb-3">Recent Board Projects</Text>
          {dummyProjects.map((project) => (
            <View 
              key={project.id}
              className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4.5 mb-3"
            >
              <View className="flex-row justify-between items-start mb-3.5">
                <View className="flex-1 pr-2">
                  <Text className="text-sm font-bold text-slate-100">{project.title}</Text>
                  <Text className="text-[10px] text-slate-400 mt-0.5">{project.client}</Text>
                </View>
                <Text className="text-[9px] font-bold text-slate-500">{project.date}</Text>
              </View>
              
              {/* Custom Progress Bar */}
              <View className="space-y-1.5">
                <View className="flex-row justify-between items-center">
                  <Text className="text-[9px] font-bold text-slate-500">Milestone Progress</Text>
                  <Text className="text-[9px] font-extrabold text-slate-300">{Math.round(project.progress * 100)}%</Text>
                </View>
                <View className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <View 
                    style={{ width: `${project.progress * 100}%` }}
                    className={`h-full rounded-full ${
                      project.progress === 1.0 ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
