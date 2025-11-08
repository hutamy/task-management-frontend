import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Task {
  id: number;
  user_id: number;
  parent_id?: number;
  title: string;
  description: string;
  status: 'to do' | 'in progress' | 'done';
  created_at: string;
  updated_at: string;
  sub_tasks?: Task[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user_id: number;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  parent_id?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: 'to do' | 'in progress' | 'done';
}

export const authAPI = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/login', data);
    return response.data;
  },
};

export const tasksAPI = {
  getTasks: async (status?: string): Promise<Task[]> => {
    const params = status ? { status } : {};
    const response = await api.get<{ tasks: Task[] }>('/tasks', { params });
    return response.data.tasks || [];
  },

  createTask: async (data: CreateTaskRequest): Promise<Task> => {
    const response = await api.post<{ task: Task }>('/tasks', data);
    return response.data.task;
  },

  updateTask: async (id: number, data: UpdateTaskRequest): Promise<Task> => {
    const response = await api.put<{ task: Task }>(`/tasks/${id}`, data);
    return response.data.task;
  },

  deleteTask: async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },
};

export default api;
