import { get, set, del, clear } from 'idb-keyval';

export const storage = {
  getItem: async (name) => {
    return (await get(name)) || null;
  },
  setItem: async (name, value) => {
    await set(name, value);
  },
  removeItem: async (name) => {
    await del(name);
  },
  clear: async () => {
    await clear();
  },
};
