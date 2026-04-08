"use client";

import { useEffect, useState, useMemo } from "react";
import { useHotelStore } from "@/stores/hotel-store";
import { formatDate } from "@/lib/utils";
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { addDays, startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";

export default function CalendarPage() {
  const { activeHotelId } = useHotelStore();
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  useEffect(() => {
    if (!activeHotelId) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/rooms?hotelId=${activeHotelId}`).then((r) => r.json()),
      fetch(`/api/bookings?hotelId=${activeHotelId}&from=${monthStart.toISOString()}&to=${monthEnd.toISOString()}`).then((r) => r.json()),
    ]).then(([roomsData, bookingsData]) => {
      setRooms(roomsData);
      setBookings(bookingsData);
      setLoading(false);
    });
  }, [activeHotelId, currentDate]);

  const getBookingForCell = (roomId: string, day: Date) => {
    return bookings.find(
      (b: any) =>
        b.roomId === roomId &&
        isWithinInterval(day, {
          start: new Date(b.checkIn),
          end: addDays(new Date(b.checkOut), -1),
        })
    );
  };

  const prevMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const nextMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  if (!activeHotelId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Calendar className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Selectionnez un hotel</h2>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Planning</h1>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-semibold text-slate-900 dark:text-white min-w-[180px] text-center">
            {format(currentDate, "MMMM yyyy", { locale: fr })}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-left text-xs font-medium text-slate-500 border-b border-r border-slate-200 dark:border-slate-700 min-w-[100px]">
                  Chambre
                </th>
                {days.map((day) => (
                  <th
                    key={day.toISOString()}
                    className={`px-1 py-2 text-center text-xs font-medium border-b border-slate-200 dark:border-slate-700 min-w-[36px] ${
                      isSameDay(day, new Date())
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700"
                        : "text-slate-500"
                    }`}
                  >
                    <div>{format(day, "d")}</div>
                    <div className="text-[10px]">{format(day, "EEE", { locale: fr })}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rooms.map((room: any) => (
                <tr key={room.id}>
                  <td className="sticky left-0 z-10 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium border-b border-r border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                    #{room.number}
                    <span className="text-xs text-slate-400 ml-1">{room.category.name}</span>
                  </td>
                  {days.map((day) => {
                    const booking = getBookingForCell(room.id, day);
                    return (
                      <td
                        key={day.toISOString()}
                        className={`px-0.5 py-1 border-b border-slate-100 dark:border-slate-700 text-center ${
                          isSameDay(day, new Date()) ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                        }`}
                      >
                        {booking && (
                          <div
                            className="h-6 rounded bg-blue-500 text-white text-[10px] flex items-center justify-center truncate px-1 cursor-pointer hover:bg-blue-600 transition"
                            title={`${booking.guest.firstName} ${booking.guest.lastName}`}
                          >
                            {isSameDay(day, new Date(booking.checkIn))
                              ? `${booking.guest.lastName.substring(0, 6)}`
                              : ""}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
