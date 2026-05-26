import { Request, Response } from "express";
import mongoose from "mongoose";
import { Listing } from "../models/Listing.model";
import { MandiRate } from "../models/MandiRate.model";
import { Interest } from "../models/Interest.model";
import { Order } from "../models/Order.model";
import { deleteMediaByUrls } from "../services/upload.service";
import { createAndEmitNotification } from "../services/socket.service";
import { SOCKET_EVENTS } from "../utils/socketEvents";

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
      variety,
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
      variety,
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
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    const query: any = {};
    if (cropId) query.cropId = cropId;
    if (district) query.farmDistrict = district;
    if (state) query.farmState = state;
    if (sellerId) query.sellerId = sellerId;
    if (status) query.status = status;
    else if (!sellerId) query.status = { $in: ["open", "interest_received"] }; // Public sees both open and listings with interests

    if (minPrice || maxPrice) {
      query.askingPrice = {};
      if (minPrice) query.askingPrice.$gte = Number(minPrice);
      if (maxPrice) query.askingPrice.$lte = Number(maxPrice);
    }

    let sortOption: any = { createdAt: -1 };
    if (sort === "price_asc") {
      sortOption = { askingPrice: 1, createdAt: -1 };
    } else if (sort === "price_desc") {
      sortOption = { askingPrice: -1, createdAt: -1 };
    } else if (sort === "newest") {
      sortOption = { createdAt: -1 };
    }

    const listings = await Listing.find(query)
      .populate("cropId", "name category unit")
      .populate("sellerId", "name location isVerified averageRating")
      .sort(sortOption)
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
      "variety",
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
  
  try {
    const { id: listingId, interestId } = req.params;
    const kisanId = req.user?.userId;
    
    let createdOrder: any = null;

    await session.withTransaction(async () => {
      // 1. Find the listing and verify ownership
      const listing = await Listing.findOne({ 
        _id: listingId, 
        sellerId: kisanId 
      }).session(session);

      if (!listing) {
        throw new Error('Listing not found or unauthorized');
      }

      if (listing.status === 'sale_confirmed') {
        throw new Error('Deal already confirmed for this listing');
      }

      // 2. Find the interest being accepted
      const interest = await Interest.findOne({ 
        _id: interestId, 
        listingId: listingId,
        status: 'pending'
      }).session(session);

      if (!interest) {
        throw new Error('Interest not found or already processed');
      }

      const orderQuantity = interest.quantity || listing.quantity;

      // 3. Create the Order — array wrapper is mandatory for session
      const orderDocs = await Order.create([{
        listingId: listing._id,
        interestId: interest._id,
        buyerId: interest.buyerId,
        sellerId: listing.sellerId,
        agreedPrice: interest.price,
        quantity: orderQuantity,
        unit: listing.unit,
        totalAmount: interest.price * orderQuantity,
        status: 'sale_confirmed',
        timeline: [{
          status: 'sale_confirmed',
          timestamp: new Date(),
          actorId: new mongoose.Types.ObjectId(kisanId),
          note: 'Kisan ne deal confirm ki'
        }]
      }], { session });

      createdOrder = orderDocs[0];

      // 4. Set orderId on the accepted interest
      await Interest.findByIdAndUpdate(
        interest._id,
        { 
          status: 'accepted',
          orderId: createdOrder._id 
        },
        { session }
      );

      // 5. Reject all other pending interests on this listing
      await Interest.updateMany(
        { 
          listingId: listing._id, 
          _id: { $ne: interest._id },
          status: 'pending'
        },
        { status: 'rejected' },
        { session }
      );

      // 6. Update the listing status
      await Listing.findByIdAndUpdate(
        listing._id,
        { 
          status: 'sale_confirmed',
          confirmedBuyerId: interest.buyerId
        },
        { session }
      );
    });

    session.endSession();

    // Populate the order for socket notifications (outside transaction)
    const populatedOrder = await Order.findById(createdOrder._id)
      .populate({ path: 'listingId', select: 'farmAddress farmDistrict farmState', populate: { path: 'cropId', select: 'name' } })
      .populate('buyerId', 'name phone')
      .populate('sellerId', 'name phone');

    if (populatedOrder) {
      const cropName = (populatedOrder.listingId as any)?.cropId?.name ?? 'Fasal';
      const kisan = populatedOrder.sellerId as any;
      const buyer = populatedOrder.buyerId as any;
      const listing = populatedOrder.listingId as any;

      Promise.all([
        // Admin notification
        createAndEmitNotification({
          type: SOCKET_EVENTS.NEW_DEAL,
          message: `New deal: ${cropName} - ${populatedOrder.quantity} ${populatedOrder.unit} | Rs.${populatedOrder.totalAmount}`,
          payload: {
            orderId: populatedOrder._id.toString(),
            kisanName: kisan?.name ?? '',
            kisanPhone: kisan?.phone ?? '',
            buyerName: buyer?.name ?? '',
            buyerPhone: buyer?.phone ?? '',
            cropName,
            quantity: populatedOrder.quantity,
            unit: populatedOrder.unit,
            agreedPrice: populatedOrder.agreedPrice,
            totalAmount: populatedOrder.totalAmount,
            farmAddress: listing?.farmAddress ?? '',
            farmDistrict: listing?.farmDistrict ?? '',
            farmState: listing?.farmState ?? '',
            createdAt: populatedOrder.createdAt
          },
          targetRole: 'admin',
          targetUserId: null,
          orderId: populatedOrder._id.toString()
        }),

        // Buyer notification
        createAndEmitNotification({
          type: SOCKET_EVENTS.OFFER_ACCEPTED,
          message: `Aapka offer accept ho gaya! ${cropName} - Rs.${populatedOrder.totalAmount}`,
          payload: {
            orderId: populatedOrder._id.toString(),
            cropName,
            quantity: populatedOrder.quantity,
            unit: populatedOrder.unit,
            agreedPrice: populatedOrder.agreedPrice,
            totalAmount: populatedOrder.totalAmount
          },
          targetRole: 'buyer',
          targetUserId: buyer?._id?.toString(),
          orderId: populatedOrder._id.toString()
        }),

        // Kisan notification
        createAndEmitNotification({
          type: SOCKET_EVENTS.ORDER_STATUS_UPDATED,
          message: `Deal confirm ho gayi! ${cropName} - Rs.${populatedOrder.totalAmount}. Hamari team jald contact karegi.`,
          payload: {
            orderId: populatedOrder._id.toString(),
            cropName,
            quantity: populatedOrder.quantity,
            unit: populatedOrder.unit,
            agreedPrice: populatedOrder.agreedPrice,
            totalAmount: populatedOrder.totalAmount
          },
          targetRole: 'kisan',
          targetUserId: kisan?._id?.toString(),
          orderId: populatedOrder._id.toString()
        })
      ]).catch((err) => {
        console.error('Notification creation failed:', err)
      })
    }

    res.status(200).json({
      success: true,
      message: 'Deal confirm ho gayi',
      orderId: createdOrder._id,
      totalAmount: createdOrder.totalAmount,
      agreedPrice: createdOrder.agreedPrice,
      quantity: createdOrder.quantity
    });
  } catch (error: any) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    
    const statusCode = error.message.includes('not found') || error.message.includes('already') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
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
