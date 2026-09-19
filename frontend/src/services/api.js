/**
 * CivicHelp AI Frontend API Client
 * Communicates with Express Gateway at /api
 */

export async function analyzeCivicQuery(query, language = 'en') {
  const response = await fetch('/api/civic/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, language })
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data.message || data.error || `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function fetchVerifiedServices() {
  const response = await fetch('/api/services');
  if (!response.ok) {
    throw new Error('Failed to fetch verified services catalog');
  }
  return response.json();
}

export async function fetchHealthStatus() {
  const response = await fetch('/api/health');
  if (!response.ok) {
    throw new Error('API Gateway offline');
  }
  return response.json();
}

export async function fetchVaultStatus() {
  const response = await fetch('/api/aws/vault-status');
  if (!response.ok) {
    throw new Error('Failed to fetch AWS vault status');
  }
  return response.json();
}
