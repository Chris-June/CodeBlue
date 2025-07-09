import React from 'react';
import BrandLogo from '@/assets/Logo.png';

const Welcome: React.FC = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center h-full opacity-70 pointer-events-none text-center">
      <img src={BrandLogo} alt="IntelliSync Logo" className="w-64 h-64 mb-4 opacity-70" />
      <h1 className="text-2xl font-bold text-gray-300">Welcome</h1>
    </div>
  );
};

export default Welcome;
