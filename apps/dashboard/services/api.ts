const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function createProject(url: string) {
  const response = await fetch(`${API_URL}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!response.ok) throw new Error('Failed to create project');
  return response.json();
}

export async function startCrawl(projectId: string) {
  const response = await fetch(`${API_URL}/api/crawl`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  });
  if (!response.ok) throw new Error('Failed to start crawl');
  return response.json();
}

export async function startAnalysis(projectId: string) {
  const response = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  });
  if (!response.ok) throw new Error('Failed to start analysis');
  return response.json();
}

export async function generatePrompt(projectId: string) {
  const response = await fetch(`${API_URL}/api/generate-prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  });
  if (!response.ok) throw new Error('Failed to generate prompt');
  return response.json();
}
