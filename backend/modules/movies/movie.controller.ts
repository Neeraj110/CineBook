import type { Request, Response } from "express";
import {
  addMovie,
  removeMovie,
  updateMovieDetails,
  fetchAllMovies,
  fetchMovieById,
  searchForMovies,
  fetchMoviesByGenre,
  fetchShowsByMovieId,
} from "./movie.service.js";
import {
  createMovieSchema,
  updateMovieSchema,
  deleteMovieSchema,
  searchMovieSchema,
  movieGenreSchema,
  movieIdParamSchema,
  getMoviesQuerySchema,
} from "./movie.validation.js";
import { apiResponse, asyncHandler } from "../../utils/index.js";

export const createMovie = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, duration_minutes, release_date, language, genre } =
    createMovieSchema.parse(req.body);
  const movie = await addMovie(title, description, duration_minutes, release_date, language, genre);
  return apiResponse(res, 201, { movie }, "Movie created successfully");
});

export const getAllMovies = asyncHandler(async (req: Request, res: Response) => {
  const result = await fetchAllMovies(getMoviesQuerySchema.parse(req.query));
  return apiResponse(res, 200, result);
});

export const searchMovies = asyncHandler(async (req: Request, res: Response) => {
  const { q } = searchMovieSchema.parse(req.query);
  return apiResponse(res, 200, { movies: await searchForMovies(q || "") });
});

export const getMoviesByGenre = asyncHandler(async (req: Request, res: Response) => {
  const { genre } = movieGenreSchema.parse(req.params);
  return apiResponse(res, 200, { movies: await fetchMoviesByGenre(genre) });
});

export const getMovieById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = movieIdParamSchema.parse(req.params);
  return apiResponse(res, 200, { movie: await fetchMovieById(id) });
});

export const getMovieShows = asyncHandler(async (req: Request, res: Response) => {
  const { id } = movieIdParamSchema.parse(req.params);
  return apiResponse(res, 200, { shows: await fetchShowsByMovieId(id) });
});

export const updateMovie = asyncHandler(async (req: Request, res: Response) => {
  const { id } = movieIdParamSchema.parse(req.params);
  const movie = await updateMovieDetails(id, updateMovieSchema.parse(req.body));
  return apiResponse(res, 200, { movie }, "Movie updated successfully");
});

export const deleteMovie = asyncHandler(async (req: Request, res: Response) => {
  const { id } = deleteMovieSchema.parse(req.params);
  const movie = await removeMovie(id);
  return apiResponse(res, 200, { movie }, "Movie deleted successfully");
});
