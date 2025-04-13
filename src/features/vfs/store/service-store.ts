import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface Service {
  id: string;
  name: string;
  content: string; // JavaScript code as string
  createdAt: Date;
  updatedAt: Date;
}

interface ServiceState {
  services: Record<string, Service>;
  addService: (service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateService: (id: string, content: string) => void;
  deleteService: (id: string) => void;
  getService: (id: string) => Service | undefined;
  getAllServices: () => Service[];
}

export const useServiceStore = create<ServiceState>()(
  persist(
    immer((set, get) => ({
      services: {},

      addService: service => {
        const id = crypto.randomUUID();
        const now = new Date();
        set(state => {
          state.services[id] = {
            ...service,
            id,
            createdAt: now,
            updatedAt: now,
          };
        });
      },

      updateService: (id, content) => {
        set(state => {
          if (state.services[id]) {
            state.services[id].content = content;
            state.services[id].updatedAt = new Date();
          }
        });
      },

      deleteService: id => {
        set(state => {
          delete state.services[id];
        });
      },

      getService: id => {
        return get().services[id];
      },

      getAllServices: () => {
        return Object.values(get().services);
      },
    })),
    {
      name: 'service-storage',
    },
  ),
);
