import {
  createMovie,
  getAllMovies,
  getMovieById,
  updateMovie,
  deleteMovie,
  searchMovies,
  getMoviesByGenre,
  getShowsByMovieId,
} from "./movie.repository.js";
import { apiError } from "../../utils/index.js";
import type { MovieQueryOptions } from "../../types/index.js";

const isForeignKeyError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; message?: unknown };
  return (
    candidate.code === "P2003" ||
    (typeof candidate.message === "string" &&
      (candidate.message.includes("foreign key constraint") ||
        candidate.message.includes("RESTRICT")))
  );
};

export const addMovie = async (
  title,
  description,
  duration_minutes,
  release_date,
  language,
  genre,
  movieMeta = {},
) => {
  const newMovie = await createMovie(
    title,
    description,
    duration_minutes,
    release_date,
    language,
    genre,
    movieMeta,
  );
  return newMovie;
};

export const fetchAllMovies = async (options?: MovieQueryOptions) => {
  const result = await getAllMovies(options);
  return result;
};

export const fetchMovieById = async (id) => {
  const movie = await getMovieById(id);
  if (!movie) {
    throw apiError(404, "Movie not found");
  }
  return movie;
};

export const updateMovieDetails = async (id, updates) => {
  const updatedMovie = await updateMovie(id, updates);
  if (!updatedMovie) {
    throw apiError(404, "Movie not found");
  }
  return updatedMovie;
};

export const removeMovie = async (id) => {
  try {
    const deletedMovie = await deleteMovie(id);
    if (!deletedMovie) {
      throw apiError(404, "Movie not found");
    }
    return deletedMovie;
  } catch (err) {
    // Foreign key constraint — movie has scheduled shows
    if (isForeignKeyError(err)) {
      throw apiError(
        409,
        "Cannot delete this movie because it has completed or in-progress shows.",
      );
    }
    throw err;
  }
};

export const searchForMovies = async (searchTerm) => {
  const movies = await searchMovies(searchTerm);
  return movies;
};

export const fetchMoviesByGenre = async (genre) => {
  const movies = await getMoviesByGenre(genre);
  return movies;
};

export const fetchShowsByMovieId = async (movieId) => {
  const shows = await getShowsByMovieId(movieId);
  return shows;
};
