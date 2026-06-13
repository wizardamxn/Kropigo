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
  withdrawInterest,
  getMyInterestForListing,
} from "../controllers/listing.controller";
import { authenticate, requireRole } from "../middleware/authMiddleware";
import { listingWindow } from "../middleware/listingWindow";
import { validate } from "../middleware/validate";
import {
  createListingSchema,
  updateListingSchema,
  submitInterestSchema,
} from "../validators/listing.validator";

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
  validate(createListingSchema),
  createListing,
);

router.put("/:id", authenticate, requireRole("kisan"), validate(updateListingSchema), updateListing);

router.delete("/:id", authenticate, requireRole("kisan"), deleteListing);

// Kisan: Interest management
router.get("/:id/interests", authenticate, requireRole("kisan"), getListingInterests);
router.patch("/:id/interests/:interestId/accept", authenticate, requireRole("kisan"), acceptInterest);
router.patch("/:id/interests/:interestId/reject", authenticate, requireRole("kisan"), rejectInterest);

// Buyer: Submit / withdraw interest & check own interest
router.post("/:id/interests", authenticate, requireRole("buyer"), validate(submitInterestSchema), submitInterest);
router.delete("/:id/interests/:interestId", authenticate, requireRole("buyer"), withdrawInterest);
router.get("/:id/interests/mine", authenticate, requireRole("buyer"), getMyInterestForListing);

export default router;
