import type { Request, Response } from "express";
import {
  addTheater,
  fetchAllTheaters,
  fetchTheaterById,
  updateTheaterDetails,
  removeTheater,
  addScreenToTheater,
  fetchScreensByTheater,
  fetchScreenById,
  updateScreenDetails,
  removeScreen,
  getTheaterShows,
  getTheaterSeats,
  getTheaterByIdWithScreens,
  getAllTheatersWithScreens,
} from "./theater.service.js";
import {
  createTheaterSchema,
  updateTheaterSchema,
  deleteTheaterSchema,
  createScreenSchema,
  updateScreenSchema,
  theaterIdParamSchema,
  screenIdParamSchema,
  getTheatersQuerySchema,
} from "./theater.validation.js";
import { apiResponse, asyncHandler } from "../../utils/index.js";

export const createTheaterController = asyncHandler(async (req: Request, res: Response) => {
  const { name, address, city } = createTheaterSchema.parse(req.body);
  return apiResponse(
    res,
    201,
    { theater: await addTheater(name, address, city) },
    "Theater created successfully",
  );
});

export const getAllTheatersController = asyncHandler(async (req: Request, res: Response) =>
  apiResponse(res, 200, await fetchAllTheaters(getTheatersQuerySchema.parse(req.query))),
);
export const getAllTheatersWithScreensController = asyncHandler(
  async (req: Request, res: Response) =>
    apiResponse(res, 200, await getAllTheatersWithScreens(getTheatersQuerySchema.parse(req.query))),
);

export const getTheaterByIdController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = theaterIdParamSchema.parse(req.params);
  return apiResponse(res, 200, { theater: await fetchTheaterById(id) });
});

export const getTheaterWithScreensController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = theaterIdParamSchema.parse(req.params);
  return apiResponse(res, 200, { theater: await getTheaterByIdWithScreens(id) });
});

export const updateTheaterController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = theaterIdParamSchema.parse(req.params);
  return apiResponse(
    res,
    200,
    { theater: await updateTheaterDetails(id, updateTheaterSchema.parse(req.body)) },
    "Theater updated successfully",
  );
});

export const deleteTheaterController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = deleteTheaterSchema.parse(req.params);
  return apiResponse(
    res,
    200,
    { theater: await removeTheater(id) },
    "Theater deleted successfully",
  );
});

export const createScreenController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = theaterIdParamSchema.parse(req.params);
  const { name, rows, seatsPerRow } = createScreenSchema.parse(req.body);
  return apiResponse(
    res,
    201,
    { screen: await addScreenToTheater(id, name, "2D", rows, seatsPerRow) },
    "Screen created successfully",
  );
});

export const getTheaterScreensController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = theaterIdParamSchema.parse(req.params);
  return apiResponse(res, 200, { screens: await fetchScreensByTheater(id) });
});

export const getScreenController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = theaterIdParamSchema.parse(req.params);
  const { screenId } = screenIdParamSchema.parse(req.params);
  return apiResponse(res, 200, { screen: await fetchScreenById(id, screenId) });
});

export const updateScreenController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = theaterIdParamSchema.parse(req.params);
  const { screenId } = screenIdParamSchema.parse(req.params);
  return apiResponse(
    res,
    200,
    { screen: await updateScreenDetails(id, screenId, updateScreenSchema.parse(req.body)) },
    "Screen updated successfully",
  );
});

export const deleteScreenController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = theaterIdParamSchema.parse(req.params);
  const { screenId } = screenIdParamSchema.parse(req.params);
  return apiResponse(
    res,
    200,
    { screen: await removeScreen(id, screenId) },
    "Screen deleted successfully",
  );
});

export const getTheaterShowsController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = theaterIdParamSchema.parse(req.params);
  return apiResponse(res, 200, { shows: await getTheaterShows(id) });
});

export const getTheaterSeatsController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = theaterIdParamSchema.parse(req.params);
  return apiResponse(res, 200, { seats: await getTheaterSeats(id) });
});
