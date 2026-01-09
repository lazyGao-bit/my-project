'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface StoryProps {
  title: string;
  p1: string;
  p2: string;
  p3: string;
}

export default function Story({ title, p1, p2, p3 }: StoryProps) {
  return (
    <section id="story" className="py-32 max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold mb-6" dangerouslySetInnerHTML={{ __html: title }} />
          <div className="space-y-6 text-zinc-400 leading-relaxed">
            <p>{p1}</p>
            <p>{p2}</p>
            <p>{p3}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative h-96 rounded-3xl overflow-hidden bg-zinc-800"
        >
           <Image 
            src="/globe.svg" 
            alt="Brand illustration" 
            layout="fill" 
            objectFit="contain"
            className="p-12 opacity-20"
          />
           <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-3xl font-bold text-white/50">YYT GLOBAL</p>
            </div>
        </motion.div>
      </div>
    </section>
  );
}
