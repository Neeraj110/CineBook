import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import http from "http";
import { pinoHttp } from "pino-http";
import { initSocket } from "./config/socket.js";
import passport from "passport";
import { configurePassport } from "./config/passport.js";
import { errorHandler } from "./middlewares/errormiddleware.js";
import authRouter from "./modules/auth/auth.routes.js";
import bookingRouter from "./modules/bookings/booking.routes.js";
import movieRouter from "./modules/movies/movie.routes.js";
import paymentRouter from "./modules/payments/payment.routes.js";
import showRouter from "./modules/shows/show.routes.js";
import theaterRouter from "./modules/theaters/theater.routes.js";

dotenv.config();
configurePassport();

// Fix: Enable BigInt serialization in Express JSON responses
(BigInt.prototype as any).toJSON = function () {
  const intVal = Number(this);
  return Number.isSafeInteger(intVal) ? intVal : this.toString();
};

const app = express();
const port = Number(process.env.PORT ?? 5000);

const server = http.createServer(app);
initSocket(server);

app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5000"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(
  pinoHttp({
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname,req,res,responseTime",
      },
    },
    customSuccessMessage: function (req, res, responseTime) {
      const url = (req as any).originalUrl || req.url;
      return `${req.method} ${url} ${res.statusCode} in ${responseTime}ms`;
    },
  }),
);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Ticket Booking API is running",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/movies", movieRouter);
app.use("/api/shows", showRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/theaters", theaterRouter);
app.use(errorHandler);

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

export { app, server };
