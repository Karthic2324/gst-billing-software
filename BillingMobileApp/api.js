import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 10.0.2.2 points to localhost from the Android Emulator
const API = axios.create({
  baseURL: 'http://10.0.2.2:8081/api',
});

// Auto-attach JWT token stored from login to every request
API.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;