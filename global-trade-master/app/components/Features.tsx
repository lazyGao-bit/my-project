'use client';

import { motion } from 'framer-motion';
import { Globe, File, AppWindow } from 'lucide-react';
import React from 'react';

// 定义单个 feature 的数据结构类型
interface FeatureItem {
  icon: string;
  name: string;
  description: string;
}

// 定义 Features 组件接收的 props 类型
interface FeaturesProps {
  title: string;
  items: FeatureItem[];
}

// 将图标名称字符串映射到实际的 Lucide 图标组件
const featureIcons: { [key: string]: React.ElementType } = {
  Globe,
  File,
  AppWindow,
};

export default function Features({ title, items }: FeaturesProps) {
  return (
    <section id="features" className="py-24 max-w-7xl mx-auto px-6">
      <h2 className="text-center text-4xl font-bold mb-16">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {items.map((feature, index) => {
          const Icon = featureIcons[feature.icon];
          return (
            <motion.div
              key={index}
              className="bg-zinc-800/50 p-8 rounded-2xl"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-purple-500/20 mb-6">
                {Icon && <Icon className="h-6 w-6 text-purple-400" />}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.name}</h3>
              <p className="text-zinc-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
