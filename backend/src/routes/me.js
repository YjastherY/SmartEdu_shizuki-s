import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { publicUser } from "../utils.js";

const router = Router();

router.get("/me", authRequired, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
