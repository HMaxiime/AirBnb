import { Router } from "express";
import authRouter from "./auth.routes.js";
import usersRouter from "./users.routes.js";
import listingsRouter from "./listings.routes.js";
import bookingsRouter from "./booking.routes.js";
import airouter from "./ai.routes.js";
import uploadRouter from "./upload.routes.js";


const v1Router = Router();

v1Router.use("/auth", authRouter);
v1Router.use("/users", usersRouter);
v1Router.use("/listings", listingsRouter);
v1Router.use("/bookings", bookingsRouter);
v1Router.use("/ai", airouter);
v1Router.use("/upload", uploadRouter);
// v1Router.use("/reviews", reviewsRouter);

export default v1Router;