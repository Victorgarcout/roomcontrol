import { create } from "zustand";
import { persist } from "zustand/middleware";

interface HotelStore {
  activeHotelId: string | null;
  setActiveHotel: (hotelId: string) => void;
  clearActiveHotel: () => void;
}

export const useHotelStore = create<HotelStore>()(
  persist(
    (set) => ({
      activeHotelId: null,
      setActiveHotel: (hotelId) => set({ activeHotelId: hotelId }),
      clearActiveHotel: () => set({ activeHotelId: null }),
    }),
    { name: "roomcontrol-hotel" }
  )
);
