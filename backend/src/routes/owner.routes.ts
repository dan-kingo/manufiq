import {Router} from "express";
import {auth} from "../middlewares/auth.middleware.js";
import {OwnerController} from "../controllers/owner.controller.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/staff", auth(), requireRole("owner"), OwnerController.createStaff);
router.get("/staff", auth(), requireRole("owner"), OwnerController.getStaff);
router.post("/users/:id/suspend", auth(), requireRole("owner"), OwnerController.suspendUser);
router.post("/users/:id/unsuspend", auth(), requireRole("owner"), OwnerController.unsuspendUser);
router.put("/staff/:id", auth(), requireRole("owner"), OwnerController.updateStaff);
router.delete("/staff/:id", auth(), requireRole("owner"), OwnerController.deleteStaff);

export default router;