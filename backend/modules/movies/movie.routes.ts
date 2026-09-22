import { Router } from "express";
import {
  createMovie,
  getAllMovies,
  searchMovies,
  getMoviesByGenre,
  getMovieById,
  getMovieShows,
  updateMovie,
  deleteMovie,
} from "./movie.controller.js";
import { authenticate, authorizeRoles } from "../../middlewares/authmiddleware.js";

const router = Router();

router.get("/", getAllMovies);
router.get("/search", searchMovies);
router.get("/genre/:genre", getMoviesByGenre);
router.get("/:id/shows", getMovieShows);
router.get("/:id", getMovieById);
router.post("/", authenticate, authorizeRoles("admin"), createMovie);
router.patch("/:id", authenticate, authorizeRoles("admin"), updateMovie);
router.delete("/:id", authenticate, authorizeRoles("admin"), deleteMovie);

export default router;
