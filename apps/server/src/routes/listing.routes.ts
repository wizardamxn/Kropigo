import { Router, type Router as ExpressRouter } from "express";
import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
} from "../controllers/listing.controller";
import { authenticate, requireRole } from "../middleware/authMiddleware";
import { listingWindow } from "../middleware/listingWindow";

const router: ExpressRouter = Router();

// Public routes
router.get("/", getListings);
router.get("/:id", getListingById);

// Protected routes
router.post(
  "/",
  authenticate,
  requireRole("kisan"),
  listingWindow,
  createListing,
);

router.put("/:id", authenticate, requireRole("kisan"), updateListing);

router.delete("/:id", authenticate, requireRole("kisan"), deleteListing);

export default router;
