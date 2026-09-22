import type { Request, Response } from "express";
import {
  addShow,
  fetchAllShows,
  fetchShowById,
  fetchShowsByMovieId,
  fetchShowsByScreenId,
  updateShowDetails,
  removeShow,
} from "./show.service.js";
import {
  createShowSchema,
  updateShowSchema,
  showIdParamSchema,
  getShowsQuerySchema,
} from "./show.validation.js";
import { getIO } from "../../config/socket.js";
import { apiResponse, asyncHandler } from "../../utils/index.js";

export const createShowController = asyncHandler(async (req: Request, res: Response) => {
  const show = await addShow(createShowSchema.parse(req.body));
  getIO().emit("admin_data_changed", { type: "show_created", showId: show.id });
  return apiResponse(res, 201, { show }, "Show created successfully");
});

export const getAllShowsController = asyncHandler(async (req: Request, res: Response) => {
  return apiResponse(res, 200, await fetchAllShows(getShowsQuerySchema.parse(req.query)));
});

export const getShowByIdController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = showIdParamSchema.parse(req.params);
  return apiResponse(res, 200, { show: await fetchShowById(id) });
});

export const getShowsByMovieController = asyncHandler(async (req: Request, res: Response) => {
  const movieId = showIdParamSchema.shape.id.parse(req.params.movieId);
  return apiResponse(res, 200, { shows: await fetchShowsByMovieId(movieId) });
});

export const getShowsByScreenController = asyncHandler(async (req: Request, res: Response) => {
  const screenId = showIdParamSchema.shape.id.parse(req.params.screenId);
  return apiResponse(res, 200, { shows: await fetchShowsByScreenId(screenId) });
});

export const updateShowController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = showIdParamSchema.parse(req.params);
  const show = await updateShowDetails(id, updateShowSchema.parse(req.body));
  getIO().emit("admin_data_changed", { type: "show_updated", showId: id });
  return apiResponse(res, 200, { show }, "Show updated successfully");
});

export const deleteShowController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = showIdParamSchema.parse(req.params);
  const show = await removeShow(id);
  getIO().emit("admin_data_changed", { type: "show_deleted", showId: id });
  return apiResponse(res, 200, { show }, "Show deleted successfully");
});
