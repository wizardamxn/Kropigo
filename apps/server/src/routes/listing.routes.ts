import { Router, type Router as ExpressRouter } from "express";
import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  getListingInterests,
  acceptInterest,
  rejectInterest,
  submitInterest,
  getMyInterestForListing,
} from "../controllers/listing.controller";
import { authenticate, requireRole } from "../middleware/authMiddleware";
import { listingWindow } from "../middleware/listingWindow";

const router: ExpressRouter = Router();

// Public routes
router.get("/", getListings);
router.get("/:id", getListingById);

// Protected routes — Kisan
router.post(
  "/",
  authenticate,
  requireRole("kisan"),
  listingWindow,
  createListing,
);

router.put("/:id", authenticate, requireRole("kisan"), updateListing);

router.delete("/:id", authenticate, requireRole("kisan"), deleteListing);

// Kisan: Interest management
router.get("/:id/interests", authenticate, requireRole("kisan"), getListingInterests);
router.patch("/:id/interests/:interestId/accept", authenticate, requireRole("kisan"), acceptInterest);
router.patch("/:id/interests/:interestId/reject", authenticate, requireRole("kisan"), rejectInterest);

// Buyer: Submit interest & check own interest
router.post("/:id/interests", authenticate, requireRole("buyer"), submitInterest);
router.get("/:id/interests/mine", authenticate, requireRole("buyer"), getMyInterestForListing);

export default router;
