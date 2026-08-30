import React, { useState } from 'react';
import { shoonyaApi } from '../api/shoonyaApi';
import { GroundTruthModal } from './GroundTruthModal';

interface Props {
  status: string;
}

export const SimulationControls: React.FC<Props> = ({ status }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [groundTruthData, setGroundTruthData] = useState<any>(null);

  const handleStart = async () => {
    try { await shoonyaApi.startSimulation(); } catch (e) { console.error(e); }
  };

  const handleReset = async () => {
    try { await shoonyaApi.resetSimulation(); } catch (e) { console.error(e); }
  };

  const handleReveal = async () => {
    try {
      const data = await shoonyaApi.getGroundTruth();
      setGroundTruthData(data);
      setModalOpen(true);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="flex gap-2 p-4 bg-gray-900 border-b border-gray-800">
      <button 
        onClick={handleStart}
        disabled={status === 'RUNNING'}
        className={`px-4 py-2 rounded ${status === 'RUNNING' ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'} text-white font-semibold`}
      >
        {status === 'RUNNING' ? 'Simulation Running...' : 'Run Simulation'}
      </button>
      <button 
        onClick={handleReset}
        className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold"
      >
        Reset Demo
      </button>
      <button 
        onClick={handleReveal}
        disabled={status !== 'RUNNING' && status !== 'COMPLETE'}
        className={`px-4 py-2 rounded ${status !== 'RUNNING' && status !== 'COMPLETE' ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-700'} text-white font-semibold`}
      >
        Reveal Ground Truth
      </button>
      
      {modalOpen && (
        <GroundTruthModal 
          data={groundTruthData} 
          onClose={() => setModalOpen(false)} 
        />
      )}
    </div>
  );
};
