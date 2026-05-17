import { Request, Response } from "express";
import { Listing } from "../models/Listing.model";
import { MandiRate } from "../models/MandiRate.model";
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

    const total = await Listing.countDocuments(query);

    res.status(200).json({
      success: true,
      data: listings,
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

    res.status(200).json({ success: true, data: listing });
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

    // TODO: Cancel all pending interests (if Interest model exists)
    // await Interest.updateMany({ listingId: listing._id, status: 'pending' }, { status: 'withdrawn' });

    await listing.deleteOne();
    res
      .status(200)
      .json({ success: true, message: "Listing deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
