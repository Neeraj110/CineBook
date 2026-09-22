import { Router } from "express";
import {
  createBookingController,
  getAllBookingsController,
  getMyBookingsController,
  getBookingByIdController,
  cancelBookingController,
} from "./booking.controller.js";
import { authenticate, authorizeRoles } from "../../middlewares/authmiddleware.js";

const router = Router();
const authenticated = [authenticate];
const adminOnly = [authenticate, authorizeRoles("admin")];

router.post("/", ...authenticated, createBookingController);
router.get("/mine", ...authenticated, getMyBookingsController);
router.get("/", ...adminOnly, getAllBookingsController);
router.get("/:id", ...authenticated, getBookingByIdController);
router.patch("/:id/cancel", ...authenticated, cancelBookingController);

export default router;
