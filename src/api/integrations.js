import { apiClient } from './base44Client';

// Custom integrations - implement these on your backend
export const InvokeLLM = async (data) => {
  return apiClient.post('/integrations/llm', data);
};

export const SendEmail = async (data) => {
  return apiClient.post('/integrations/email', data);
};

export const SendSMS = async (data) => {
  return apiClient.post('/integrations/sms', data);
};

export const UploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${apiClient.baseURL}/integrations/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiClient.token}`,
    },
    body: formData,
  });
  
  return response.json();
};

export const GenerateImage = async (data) => {
  return apiClient.post('/integrations/generate-image', data);
};

export const ExtractDataFromUploadedFile = async (fileUrl) => {
  return apiClient.post('/integrations/extract-data', { fileUrl });
};

// For backward compatibility
export const Core = {
  InvokeLLM,
  SendEmail,
  SendSMS,
  UploadFile,
  GenerateImage,
  ExtractDataFromUploadedFile,
};






