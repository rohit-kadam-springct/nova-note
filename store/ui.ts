import { create } from "zustand";

type UIState = {
  usernameModalOpen: boolean;
  setUsernameModalOpen: (v: boolean) => void;
};

export const useUI = create<UIState>((set) => ({
  usernameModalOpen: false,
  setUsernameModalOpen: (v) => set({ usernameModalOpen: v }),
}))