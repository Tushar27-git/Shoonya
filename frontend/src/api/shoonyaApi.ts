const BASE_URL = 'http://localhost:8000';

export const shoonyaApi = {
  getDashboardState: async () => {
    const res = await fetch(`${BASE_URL}/dashboard/state`);
    if (!res.ok) throw new Error('Failed to fetch dashboard state');
    return res.json();
  },
  
  startSimulation: async () => {
    const res = await fetch(`${BASE_URL}/simulation/start`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to start simulation');
    return res.json();
  },
  
  resetSimulation: async () => {
    const res = await fetch(`${BASE_URL}/simulation/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset simulation');
    return res.json();
  },
  
  getSimulationStatus: async () => {
    const res = await fetch(`${BASE_URL}/simulation/status`);
    if (!res.ok) throw new Error('Failed to fetch simulation status');
    return res.json();
  },
  
  getGroundTruth: async () => {
    const res = await fetch(`${BASE_URL}/simulation/reveal-ground-truth`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reveal ground truth');
    return res.json();
  },
  
  acceptTask: async (taskId: string, saathiId: string) => {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saathi_id: saathiId })
    });
    if (!res.ok) throw new Error('Failed to accept task');
    return res.json();
  },
  
  completeTask: async (taskId: string, saathiId: string, proof: string, status: string) => {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saathi_id: saathiId, proof, status })
    });
    if (!res.ok) throw new Error('Failed to complete task');
    return res.json();
  },
  
  approveIncident: async (incidentId: string, role: string = 'ADMIN') => {
    const res = await fetch(`${BASE_URL}/incidents/${incidentId}/approve`, {
      method: 'POST',
      headers: { 'X-Mock-Auth-Role': role }
    });
    if (!res.ok) throw new Error('Failed to approve incident');
    return res.json();
  },
  
  approveAmplifyCard: async (cardId: string, approverId: string, role: string = 'ADMIN') => {
    const res = await fetch(`${BASE_URL}/amplify/cards/${cardId}/approve`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Mock-Auth-Role': role
      },
      body: JSON.stringify({ approver_id: approverId })
    });
    if (!res.ok) throw new Error('Failed to approve card');
    return res.json();
  }
};
