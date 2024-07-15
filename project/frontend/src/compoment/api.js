import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:8000/api',
});

export const fetchRequest = async (url, method, data = null) => {
  try {
    const response = await instance({
      method: method,
      url: url,
      data: data,
    });
    return response.data;
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
};

export default instance;