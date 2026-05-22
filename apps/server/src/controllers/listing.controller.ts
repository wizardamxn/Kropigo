import { Request, Response } from "express";
import mongoose from "mongoose";
import { Listing } from "../models/Listing.model";
import { MandiRate } from "../models/MandiRate.model";
import { Interest } from "../models/Interest.model";
import { deleteMediaByUrls } from "../services/upload.service";

const parseStringArray = (value: unknown, fieldName: string): string[] => {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${fieldName} must be an array of strings`);
  }
  return value;
};

export const createListing = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      cropId,
      quantity,
      unit,
      askingPrice,
      description,
      farmAddress,
      farmState,
      farmDistrict,
      lat,
      lng,
    } = req.body;
    const mediaUrls = parseStringArray(req.body.mediaUrls, "mediaUrls");

    // Auth middleware assumed to attach user to req.user
    const sellerId = req.user?.userId;

    if (!sellerId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (mediaUrls.length > 6) {
      res
        .status(400)
        .json({ success: false, message: "Maximum 6 media files allowed" });
      return;
    }

    const listing = await Listing.create({
      cropId,
      sellerId,
      quantity,
      unit,
      askingPrice,
      description,
      mediaUrls,
      farmAddress,
      farmState,
      farmDistrict,
      farmCoordinates:
        lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined,
      status: "open", // Defaults to open or draft depending on frontend
    });

    // Fetch current Mandi rate for reference
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const latestMandiRate = await MandiRate.findOne({
      cropId,
      date: { $gte: today },
    }).sort({ date: -1 });

    res.status(201).json({
      success: true,
      data: listing,
      mandiRateReference: latestMandiRate || null,
      message: latestMandiRate
        ? `Current market rate: ₹${latestMandiRate.minPrice} - ₹${latestMandiRate.maxPrice}/${latestMandiRate.unit || "unit"}`
        : "No recent mandi rates available",
    });
  } catch (error: any) {
    const statusCode = error.message?.includes("must be an array") ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const getListings = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      cropId,
      district,
      state,
      minPrice,
      maxPrice,
      status,
      sellerId,
      page = 1,
      limit = 10,
    } = req.query;

    const query: any = {};
    if (cropId) query.cropId = cropId;
    if (district) query.farmDistrict = district;
    if (state) query.farmState = state;
    if (sellerId) query.sellerId = sellerId;
    if (status) query.status = status;
    else if (!sellerId) query.status = "open"; // default to open for public; kisan sees all their own statuses

    if (minPrice || maxPrice) {
      query.askingPrice = {};
      if (minPrice) query.askingPrice.$gte = Number(minPrice);
      if (maxPrice) query.askingPrice.$lte = Number(maxPrice);
    }

    const listings = await Listing.find(query)
      .populate("cropId", "name category unit")
      .populate("sellerId", "name location isVerified averageRating")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const listingsWithInterests = await Promise.all(
      listings.map(async (l) => {
        const interestCount = await Interest.countDocuments({ listingId: l._id });
        const unreadCount = await Interest.countDocuments({ listingId: l._id, isReadBySeller: false });
        return {
          ...l.toObject(),
          interestCount,
          hasUnreadInterests: unreadCount > 0,
        };
      })
    );

    const total = await Listing.countDocuments(query);

    res.status(200).json({
      success: true,
      data: listingsWithInterests,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    const statusCode = error.message?.includes("must be an array") ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const getListingById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate("cropId", "name category unit")
      .populate("sellerId", "name location isVerified averageRating"); // NO phone

    if (!listing) {
      res.status(404).json({ success: false, message: "Listing not found" });
      return;
    }

    // Increment viewCount
    listing.viewCount += 1;
    await listing.save();

    const interestCount = await Interest.countDocuments({ listingId: listing._id });
    const unreadCount = await Interest.countDocuments({ listingId: listing._id, isReadBySeller: false });

    const listingObj = {
      ...listing.toObject(),
      interestCount,
      hasUnreadInterests: unreadCount > 0,
    };

    res.status(200).json({ success: true, data: listingObj });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateListing = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const sellerId = req.user?.userId;
    const listing = await Listing.findOne({ _id: req.params.id, sellerId });

    if (!listing) {
      res
        .status(404)
        .json({ success: false, message: "Listing not found or unauthorized" });
      return;
    }

    if (listing.status !== "draft" && listing.status !== "open") {
      res
        .status(400)
        .json({
          success: false,
          message: "Cannot update listing in current status",
        });
      return;
    }

    const deletedMediaUrls = parseStringArray(
      req.body.deletedMediaUrls,
      "deletedMediaUrls",
    );
    const mediaUrls = parseStringArray(req.body.mediaUrls, "mediaUrls");
    const keptMediaUrls = listing.mediaUrls.filter(
      (url) => !deletedMediaUrls.includes(url),
    );

    if (keptMediaUrls.length + mediaUrls.length > 6) {
      res
        .status(400)
        .json({ success: false, message: "Maximum 6 media files allowed" });
      return;
    }

    // Delete media assets from Cloudinary after the final media count is valid.
    if (deletedMediaUrls.length > 0) {
      await deleteMediaByUrls(deletedMediaUrls);
      listing.mediaUrls = keptMediaUrls;
    }

    if (mediaUrls.length > 0) {
      listing.mediaUrls.push(...mediaUrls);
    }

    // Update other fields
    const updates = [
      "quantity",
      "unit",
      "askingPrice",
      "description",
      "farmAddress",
      "farmState",
      "farmDistrict",
      "status",
    ];
    updates.forEach((field) => {
      if (req.body[field] !== undefined) {
        (listing as any)[field] = req.body[field];
      }
    });

    await listing.save();
    res.status(200).json({ success: true, data: listing });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteListing = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const sellerId = req.user?.userId;
    const listing = await Listing.findOne({ _id: req.params.id, sellerId });

    if (!listing) {
      res
        .status(404)
        .json({ success: false, message: "Listing not found or unauthorized" });
      return;
    }

    if (listing.status !== "draft" && listing.status !== "open") {
      res
        .status(400)
        .json({
          success: false,
          message: "Only draft or open listings can be deleted",
        });
      return;
    }

    // Delete all media from Cloudinary
    if (listing.mediaUrls && listing.mediaUrls.length > 0) {
      await deleteMediaByUrls(listing.mediaUrls);
    }

    // Cancel all pending interests since the listing is deleted
    await Interest.updateMany({ listingId: listing._id, status: 'pending' }, { status: 'withdrawn' });

    await listing.deleteOne();
    res
      .status(200)
      .json({ success: true, message: "Listing deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getListingInterests = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const sellerId = req.user?.userId;
    const { id: listingId } = req.params;

    const listing = await Listing.findOne({ _id: listingId, sellerId });
    if (!listing) {
      res
        .status(404)
        .json({ success: false, message: "Listing not found or unauthorized" });
      return;
    }

    const interests = await Interest.find({ listingId })
      .populate("buyerId", "name phone location isVerified averageRating")
      .sort({ price: -1, createdAt: -1 });

    // Mark as read by seller since they are fetching them
    await Interest.updateMany(
      { listingId, isReadBySeller: false },
      { isReadBySeller: true }
    );

    res.status(200).json({ success: true, data: interests });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const acceptInterest = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const sellerId = req.user?.userId;
    const { id: listingId, interestId } = req.params;

    const listing = await Listing.findOne({ _id: listingId, sellerId }).session(session);
    if (!listing) {
      res
        .status(404)
        .json({ success: false, message: "Listing not found or unauthorized" });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    if (
      listing.status === "sale_confirmed" ||
      listing.status === "cancelled" ||
      listing.status === "closed"
    ) {
      res
        .status(400)
        .json({ success: false, message: "Listing is already inactive or sold" });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const interest = await Interest.findOne({ _id: interestId, listingId }).session(session);
    if (!interest) {
      res.status(404).json({ success: false, message: "Interest not found" });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    if (interest.status !== "pending") {
      res
        .status(400)
        .json({ success: false, message: `Interest is already ${interest.status}` });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    // Accept target interest
    interest.status = "accepted";
    await interest.save({ session });

    // Mark listing as sale_confirmed
    listing.status = "sale_confirmed";
    await listing.save({ session });

    // Reject all other pending interests for this listing
    await Interest.updateMany(
      { listingId, _id: { $ne: interestId }, status: "pending" },
      { status: "rejected" }
    ).session(session);

    await session.commitTransaction();
    session.endSession();

    res
      .status(200)
      .json({ success: true, message: "Interest accepted, sale confirmed" });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectInterest = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const sellerId = req.user?.userId;
    const { id: listingId, interestId } = req.params;

    const listing = await Listing.findOne({ _id: listingId, sellerId });
    if (!listing) {
      res
        .status(404)
        .json({ success: false, message: "Listing not found or unauthorized" });
      return;
    }

    const interest = await Interest.findOne({ _id: interestId, listingId });
    if (!interest) {
      res.status(404).json({ success: false, message: "Interest not found" });
      return;
    }

    if (interest.status !== "pending") {
      res
        .status(400)
        .json({ success: false, message: `Interest is already ${interest.status}` });
      return;
    }

    interest.status = "rejected";
    await interest.save();

    // Check if other pending interests exist
    const otherPending = await Interest.exists({ listingId, status: "pending" });
    if (!otherPending && listing.status === "interest_received") {
      listing.status = "open";
      await listing.save();
    }

    res
      .status(200)
      .json({ success: true, message: "Interest rejected successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Buyer: Submit Interest ────────────────────────────────────────────────────
export const submitInterest = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const buyerId = req.user?.userId;
    const listingId = req.params.id as string;
    const { price, quantity, notes } = req.body;

    if (!buyerId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      res.status(400).json({ success: false, message: "A valid offered price is required" });
      return;
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      res.status(404).json({ success: false, message: "Listing not found" });
      return;
    }

    if (listing.status !== "open" && listing.status !== "interest_received") {
      res.status(400).json({ success: false, message: "This listing is not accepting interests" });
      return;
    }

    // Prevent duplicate pending interest from same buyer
    const existing = await Interest.findOne({ listingId, buyerId, status: "pending" });
    if (existing) {
      res.status(409).json({ success: false, message: "You already have a pending interest on this listing" });
      return;
    }

    const interest = await Interest.create({
      listingId: new mongoose.Types.ObjectId(listingId),
      buyerId: new mongoose.Types.ObjectId(buyerId),
      price: Number(price),
      quantity: quantity ? Number(quantity) : undefined,
      notes: notes || undefined,
      status: "pending",
    });

    // Update listing counters and status
    listing.interestedBuyerCount = (listing.interestedBuyerCount || 0) + 1;
    if (listing.status === "open") {
      listing.status = "interest_received";
    }
    await listing.save();

    res.status(201).json({ success: true, data: interest });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Buyer: Get My Interest for a Listing ─────────────────────────────────────
export const getMyInterestForListing = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const buyerId = req.user?.userId;
    const listingId = req.params.id as string;

    if (!buyerId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Return the most recent interest (there may be a rejected one + a new pending one)
    const interest = await Interest.findOne({ listingId, buyerId })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: interest || null });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
