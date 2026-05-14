import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { bookingService } from "../../../lib/apiService";
import { useStore } from "../../../store/StoreContext";
import toast from "react-hot-toast";

interface CreateBookingInput {
  listingId:   string;
  totalPrice:  number;
  checkIn:     string; // "YYYY-MM-DD"
  checkOut:    string; // "YYYY-MM-DD"
  // Extra fields from BookingForm that the backend doesn't need — accepted and ignored.
  [key: string]: unknown;
}

export function useCreateBooking() {
  const qc       = useQueryClient();
  const navigate = useNavigate();
  const { dispatch } = useStore();

  return useMutation({
    mutationFn: (data: CreateBookingInput) =>
      bookingService.create({
        listingId:  data.listingId,
        totalPrice: data.totalPrice,
        checkIn:    data.checkIn,
        checkOut:   data.checkOut,
      }),

    onSuccess: (booking) => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      // Refresh both the specific listing and the whole grid so availability is current.
      qc.invalidateQueries({ queryKey: ["listing", booking.listingId] });
      qc.invalidateQueries({ queryKey: ["listings"] });
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: { message: `Booking request sent for "${booking.listingTitle}". Waiting for host approval.`, type: "success" },
      });
      toast.success("Booking request sent!");
      navigate("/bookings");
    },

    onError: (err: Error) => {
      const msg = err.message.includes("already booked")
        ? "Those dates are already taken. Please choose different dates."
        : "Booking failed. Please try again.";
      toast.error(msg);
    },
  });
}
