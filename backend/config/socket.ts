import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:5000"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Allow clients to join a room specific to a show
    socket.on("join_show", (showId: string) => {
      socket.join(`show_${showId}`);
      console.log(`Socket ${socket.id} joined show_${showId}`);
    });

    socket.on("leave_show", (showId: string) => {
      socket.leave(`show_${showId}`);
      console.log(`Socket ${socket.id} left show_${showId}`);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
