import {
  createTheater,
  getAllTheaters,
  getTheaterById,
  updateTheater,
  deleteTheater,
  getScreensByTheaterId,
  getScreenById,
  createScreen,
  updateScreen,
  deleteScreen,
  getShowsByScreenId,
  getSeatsByScreenId,
} from "./theater.repository.js";
import { apiError } from "../../utils/index.js";
import type { TheaterQueryOptions } from "../../types/index.js";

const ensureTheaterExists = async (theaterId) => {
  const theater = await getTheaterById(theaterId);
  if (!theater) {
    throw apiError(404, "Theater not found");
  }

  return theater;
};

const ensureScreenExists = async (theaterId, screenId) => {
  const screen = await getScreenById(theaterId, screenId);
  if (!screen) {
    throw apiError(404, "Screen not found for this theater");
  }

  return screen;
};

const addTheater = async (name, address, city) => {
  const newTheater = await createTheater(name, address, city);
  return newTheater;
};

const fetchAllTheaters = async (options?: TheaterQueryOptions) => {
  return await getAllTheaters(options);
};

const fetchTheaterById = async (theaterId) => {
  const theater = await getTheaterById(theaterId);
  if (!theater) {
    throw apiError(404, "Theater not found");
  }

  return theater;
};

const updateTheaterDetails = async (theaterId, updates) => {
  const theater = await ensureTheaterExists(theaterId);
  const updatedTheater = await updateTheater(theater.id, updates);

  if (!updatedTheater) {
    throw apiError(404, "Theater not found");
  }

  return updatedTheater;
};

const removeTheater = async (theaterId) => {
  const theater = await ensureTheaterExists(theaterId);
  const deletedTheater = await deleteTheater(theater.id);

  if (!deletedTheater) {
    throw apiError(404, "Theater not found");
  }

  return deletedTheater;
};

const addScreenToTheater = async (
  theaterId,
  name,
  screenType = "2D",
  rows?: number,
  seatsPerRow?: number,
) => {
  await ensureTheaterExists(theaterId);
  return await createScreen(theaterId, name, screenType, rows, seatsPerRow);
};

const fetchScreensByTheater = async (theaterId) => {
  await ensureTheaterExists(theaterId);
  return await getScreensByTheaterId(theaterId);
};

const fetchScreenById = async (theaterId, screenId) => {
  await ensureTheaterExists(theaterId);
  const screen = await getScreenById(theaterId, screenId);

  if (!screen) {
    throw apiError(404, "Screen not found for this theater");
  }

  return screen;
};

const updateScreenDetails = async (theaterId, screenId, updates) => {
  await ensureTheaterExists(theaterId);
  const screen = await ensureScreenExists(theaterId, screenId);
  const updatedScreen = await updateScreen(theaterId, screen.id, updates);

  if (!updatedScreen) {
    throw apiError(404, "Screen not found");
  }

  return updatedScreen;
};

const removeScreen = async (theaterId, screenId) => {
  await ensureTheaterExists(theaterId);
  const screen = await ensureScreenExists(theaterId, screenId);
  const deletedScreen = await deleteScreen(theaterId, screen.id);

  if (!deletedScreen) {
    throw apiError(404, "Screen not found");
  }

  return deletedScreen;
};

const getTheaterShows = async (theaterId) => {
  await ensureTheaterExists(theaterId);

  const screens = await getScreensByTheaterId(theaterId);
  const shows: Awaited<ReturnType<typeof getShowsByScreenId>> = [];

  for (const screen of screens) {
    const screenShows = await getShowsByScreenId(screen.id);
    if (screenShows && screenShows.length) {
      shows.push(...screenShows);
    }
  }

  return shows;
};

const getTheaterSeats = async (theaterId) => {
  await ensureTheaterExists(theaterId);

  const screens = await getScreensByTheaterId(theaterId);
  const seats: Awaited<ReturnType<typeof getSeatsByScreenId>> = [];

  for (const screen of screens) {
    const screenSeats = await getSeatsByScreenId(screen.id);
    if (screenSeats && screenSeats.length) {
      seats.push(...screenSeats);
    }
  }

  return seats;
};

const getTheaterByIdWithScreens = async (theaterId) => {
  const theater = await ensureTheaterExists(theaterId);
  const screens = await getScreensByTheaterId(theaterId);
  return { ...theater, screens };
};

const getAllTheatersWithScreens = async (options?: TheaterQueryOptions) => {
  return await getAllTheaters(options);
};

export {
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
};
