import { Router } from "express";
import {
  createTheaterController,
  getAllTheatersController,
  getAllTheatersWithScreensController,
  getTheaterByIdController,
  getTheaterWithScreensController,
  updateTheaterController,
  deleteTheaterController,
  createScreenController,
  getTheaterScreensController,
  getScreenController,
  updateScreenController,
  deleteScreenController,
  getTheaterShowsController,
  getTheaterSeatsController,
} from "./theater.controller.js";
import { authenticate, authorizeRoles } from "../../middlewares/authmiddleware.js";

const router = Router();
const adminOnly = [authenticate, authorizeRoles("admin")];

router.get("/with-screens", getAllTheatersWithScreensController);
router.get("/", getAllTheatersController);
router.post("/", ...adminOnly, createTheaterController);
router.get("/:id/with-screens", getTheaterWithScreensController);
router.get("/:id/screens", getTheaterScreensController);
router.post("/:id/screens", ...adminOnly, createScreenController);
router.get("/:id/screens/:screenId", getScreenController);
router.patch("/:id/screens/:screenId", ...adminOnly, updateScreenController);
router.delete("/:id/screens/:screenId", ...adminOnly, deleteScreenController);
router.get("/:id/shows", getTheaterShowsController);
router.get("/:id/seats", getTheaterSeatsController);
router.get("/:id", getTheaterByIdController);
router.patch("/:id", ...adminOnly, updateTheaterController);
router.delete("/:id", ...adminOnly, deleteTheaterController);

export default router;
