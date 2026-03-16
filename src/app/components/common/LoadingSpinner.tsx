import React from 'react';
import { Dumbbell } from 'lucide-react';

export function LoadingSpinner({ message = 'データを読み込んでいます...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl animate-pulse"
          style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
        >
          <Dumbbell size={32} className="text-white" />
        </div>
        <div>
          <div className="w-8 h-8 border-3 border-[#99CEA0]/30 border-t-[#99CEA0] rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">{message}</p>
        </div>
      </div>
    </div>
  );
}
