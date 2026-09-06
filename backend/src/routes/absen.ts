import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { authorize } from "../middleware/authorize";

const router = Router();

router.use(authMiddleware, authorize("GURU"));

router.post("/", async (req, res) => {
  res.status(201).json({ message: "Absen tercatat", data: req.body });
});

export default router;
