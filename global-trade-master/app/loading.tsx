
import { LoaderCircle } from 'lucide-react';

export default function Loading() {
  // 你可以自定义任何加载 UI
  return (
    <div className="fixed inset-0 bg-zinc-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LoaderCircle className="w-12 h-12 text-purple-500 animate-spin" />
        <p className="text-zinc-400">Loading Languages...</p>
      </div>
    </div>
  );
}
