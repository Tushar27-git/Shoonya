import React from 'react';

interface Props {
  data: any;
  onClose: () => void;
}

export const GroundTruthModal: React.FC<Props> = ({ data, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Ground Truth vs Platform State</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="text-gray-300">
          <pre className="bg-black p-4 rounded text-sm text-green-400 overflow-x-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
          <div className="mt-4 p-4 border border-blue-900 bg-blue-900/20 rounded">
            <h3 className="font-semibold text-blue-400 mb-2">Analysis</h3>
            <p className="text-sm">Compare the above true state against the platform dashboard state to evaluate ingestion latency, AI clustering accuracy, and decision support gap.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
