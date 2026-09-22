import {
  createShow,
  getAllShows,
  getShowById,
  getShowsByMovieId,
  getShowsByScreenId,
  updateShow,
  deleteShow,
} from "./show.repository.js";
import { apiError } from "../../utils/index.js";
import type { CreateShowRequest, ShowQueryOptions } from "../../types/index.js";

const notFound = (message: string) => apiError(404, message);

export const addShow = async (showDetails: CreateShowRequest) =>
  createShow({
    ...showDetails,
    movie_id: BigInt(showDetails.movie_id),
    screen_id: BigInt(showDetails.screen_id),
  });

export const fetchAllShows = async (options?: ShowQueryOptions) => getAllShows(options);

export const fetchShowById = async (id) => {
  const show = await getShowById(id);
  if (!show) throw notFound("Show not found");
  return show;
};

export const fetchShowsByMovieId = async (movieId) => getShowsByMovieId(movieId);

export const fetchShowsByScreenId = async (screenId) => getShowsByScreenId(screenId);

export const updateShowDetails = async (id, updates) => {
  const show = await updateShow(id, updates);
  if (!show) throw notFound("Show not found");
  return show;
};

export const removeShow = async (id) => {
  const show = await deleteShow(id);
  if (!show) throw notFound("Show not found");
  return show;
};
