import React from 'react';
import { Link } from 'react-router-dom';

const MainScreen: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">RailPOS</h1>
        <div className="flex space-x-4">
          <Link to="/customer-form/1" className="p-8 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600">
            Phone 1
          </Link>
          <Link to="/customer-form/2" className="p-8 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600">
            Phone 2
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MainScreen;
