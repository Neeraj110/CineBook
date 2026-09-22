import { Router } from "express";
import {
  createPaymentController,
  getMyPaymentsController,
  getPaymentByIdController,
} from "./payment.controller.js";
import { authenticate } from "../../middlewares/authmiddleware.js";

const router = Router();

router.post("/", authenticate, createPaymentController);
router.get("/mine", authenticate, getMyPaymentsController);
router.get("/:id", authenticate, getPaymentByIdController);

export default router;
