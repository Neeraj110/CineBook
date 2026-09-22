import { Router } from "express";
import {
  createShowController,
  getAllShowsController,
  getShowByIdController,
  getShowsByMovieController,
  getShowsByScreenController,
  updateShowController,
  deleteShowController,
} from "./show.controller.js";
import { authenticate, authorizeRoles } from "../../middlewares/authmiddleware.js";

const router = Router();
const adminOnly = [authenticate, authorizeRoles("admin")];

router.get("/", getAllShowsController);
router.get("/movie/:movieId", getShowsByMovieController);
router.get("/screen/:screenId", getShowsByScreenController);
router.get("/:id", getShowByIdController);
router.post("/", ...adminOnly, createShowController);
router.patch("/:id", ...adminOnly, updateShowController);
router.delete("/:id", ...adminOnly, deleteShowController);

export default router;
