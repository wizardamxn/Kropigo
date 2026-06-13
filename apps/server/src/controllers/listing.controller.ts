import { Request, Response } from "express";
import mongoose from "mongoose";
import { Listing } from "../models/Listing.model";
import { MandiRate } from "../models/MandiRate.model";
import { Interest } from "../models/Interest.model";
import { Order } from "../models/Order.model";
import { User } from "../models/user.model";
import { deleteMediaByUrls } from "../services/upload.service";
import { createAndEmitNotification } from "../services/socket.service";
import { SOCKET_EVENTS } from "../utils/socketEvents";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";

/**
 * Aggregate interest counts for a set of listings in a single query (avoids N+1).
 * Returns a Map keyed by listingId string → { count, unread }.
 */
const getInterestCounts = async (
  listingIds: mongoose.Types.ObjectId[],
): Promise<Map<string, { count: number; unread: number }>> => {
  const rows = await Interest.aggregate<{ _id: mongoose.Types.ObjectId; count: number; unread: number }>([
    { $match: { listingId: { $in: listingIds } } },
    {
      $group: {
        _id: "$listingId",
        count: { $sum: 1 },
        unread: { $sum: { $cond: ["$isReadBySeller", 0, 1] } },
      },
    },
  ]);
  return new Map(rows.map((r) => [r._id.toString(), { count: r.count, unread: r.unread }]));
};

export const createListing = asyncHandler(async (req: Request, res: Response) => {
  const {
    cropId,
    quantity,
    variety,
    unit,
    description,
    mediaUrls,
    farmAddress,
    farmState,
    farmDistrict,
    lat,
    lng,
  } = req.body;

  const sellerId = req.user?.userId;
  if (!sellerId) throw new ApiError(401, "Unauthorized");

  const listing = await Listing.create({
    cropId,
    sellerId,
    quantity,
    variety,
    unit,
    description,
    mediaUrls,
    farmAddress,
    farmState,
    farmDistrict,
    farmCoordinates:
      lat !== undefined && lng !== undefined ? { lat, lng } : undefined,
    status: "open",
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
});

export const getListings = asyncHandler(async (req: Request, res: Response) => {
  const {
    cropId,
    district,
    state,
    status,
    sellerId,
    forMap,
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

  // Map view: return a slim, unpaginated projection of geocoded listings only.
  if (forMap === "true") {
    query["farmCoordinates.lat"] = { $exists: true };
    const mapListings = await Listing.find(query)
      .populate("cropId", "name")
      .select("cropId variety quantity unit farmDistrict farmState farmCoordinates status")
      .sort({ createdAt: -1 })
      .limit(200);
    res.status(200).json({ success: true, data: mapListings });
    return;
  }

  const listings = await Listing.find(query)
    .populate("cropId", "name category unit")
    .populate("sellerId", "name location isVerified averageRating")
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const counts = await getInterestCounts(listings.map((l) => l._id));
  const listingsWithInterests = listings.map((l) => {
    const c = counts.get(l._id.toString());
    return {
      ...l.toObject(),
      interestCount: c?.count ?? 0,
      hasUnreadInterests: (c?.unread ?? 0) > 0,
    };
  });

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
});

export const getListingById = asyncHandler(async (req: Request, res: Response) => {
  const listing = await Listing.findById(req.params.id)
    .populate("cropId", "name category unit")
    .populate("sellerId", "name location isVerified averageRating"); // NO phone

  if (!listing) throw new ApiError(404, "Listing not found");

  // Increment viewCount without triggering full-document validation.
  await Listing.updateOne({ _id: listing._id }, { $inc: { viewCount: 1 } });

  const counts = await getInterestCounts([listing._id]);
  const c = counts.get(listing._id.toString());

  const listingObj = {
    ...listing.toObject(),
    viewCount: listing.viewCount + 1,
    interestCount: c?.count ?? 0,
    hasUnreadInterests: (c?.unread ?? 0) > 0,
  };

  res.status(200).json({ success: true, data: listingObj });
});

export const updateListing = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = req.user?.userId;
  const listing = await Listing.findOne({ _id: req.params.id, sellerId });

  if (!listing) throw new ApiError(404, "Listing not found or unauthorized");

  if (listing.status !== "draft" && listing.status !== "open") {
    throw new ApiError(400, "Cannot update listing in current status");
  }

  const { deletedMediaUrls, mediaUrls } = req.body as {
    deletedMediaUrls: string[];
    mediaUrls: string[];
  };
  const keptMediaUrls = listing.mediaUrls.filter(
    (url) => !deletedMediaUrls.includes(url),
  );

  if (keptMediaUrls.length + mediaUrls.length > 6) {
    throw new ApiError(400, "Maximum 6 media files allowed");
  }

  // Delete media assets from Cloudinary after the final media count is valid.
  if (deletedMediaUrls.length > 0) {
    await deleteMediaByUrls(deletedMediaUrls);
    listing.mediaUrls = keptMediaUrls;
  }

  if (mediaUrls.length > 0) {
    listing.mediaUrls.push(...mediaUrls);
  }

  // Update other scalar fields
  const updates = [
    "quantity",
    "variety",
    "unit",
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
});

export const deleteListing = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = req.user?.userId;
  const listing = await Listing.findOne({ _id: req.params.id, sellerId });

  if (!listing) throw new ApiError(404, "Listing not found or unauthorized");

  if (listing.status !== "draft" && listing.status !== "open") {
    throw new ApiError(400, "Only draft or open listings can be deleted");
  }

  // Delete all media from Cloudinary
  if (listing.mediaUrls && listing.mediaUrls.length > 0) {
    await deleteMediaByUrls(listing.mediaUrls);
  }

  // Cancel all pending interests since the listing is deleted
  await Interest.updateMany({ listingId: listing._id, status: "pending" }, { status: "withdrawn" });

  await listing.deleteOne();
  res.status(200).json({ success: true, message: "Listing deleted successfully" });
});

export const getListingInterests = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = req.user?.userId;
  const { id: listingId } = req.params;

  const listing = await Listing.findOne({ _id: listingId, sellerId });
  if (!listing) throw new ApiError(404, "Listing not found or unauthorized");

  const interests = await Interest.find({ listingId })
    .populate("buyerId", "name phone location isVerified averageRating")
    .sort({ price: -1, createdAt: -1 });

  // Mark as read by seller since they are fetching them
  await Interest.updateMany(
    { listingId, isReadBySeller: false },
    { isReadBySeller: true },
  );

  res.status(200).json({ success: true, data: interests });
});

export const acceptInterest = asyncHandler(async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  const { id: listingId, interestId } = req.params;
  const kisanId = req.user?.userId;

  let createdOrder: any = null;

  try {
    await session.withTransaction(async () => {
      // 1. Find the listing and verify ownership
      const listing = await Listing.findOne({
        _id: listingId,
        sellerId: kisanId,
      }).session(session);

      if (!listing) throw new ApiError(404, "Listing not found or unauthorized");

      if (listing.status === "sale_confirmed") {
        throw new ApiError(400, "Deal already confirmed for this listing");
      }

      if (!["open", "interest_received"].includes(listing.status)) {
        throw new ApiError(400, "Listing is not accepting deals (expired, cancelled, or closed)");
      }

      // 2. Find the interest being accepted
      const interest = await Interest.findOne({
        _id: interestId,
        listingId: listingId,
        status: "pending",
      }).session(session);

      if (!interest) throw new ApiError(400, "Interest not found or already processed");

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
        status: "sale_confirmed",
        timeline: [{
          status: "sale_confirmed",
          timestamp: new Date(),
          actorId: new mongoose.Types.ObjectId(kisanId),
          note: "Kisan ne deal confirm ki",
        }],
      }], { session });

      createdOrder = orderDocs[0];

      // 4. Set orderId on the accepted interest
      await Interest.findByIdAndUpdate(
        interest._id,
        { status: "accepted", orderId: createdOrder._id },
        { session },
      );

      // 5. Reject all other pending interests on this listing
      await Interest.updateMany(
        { listingId: listing._id, _id: { $ne: interest._id }, status: "pending" },
        { status: "rejected" },
        { session },
      );

      // 6. Update the listing status
      await Listing.findByIdAndUpdate(
        listing._id,
        { status: "sale_confirmed", confirmedBuyerId: interest.buyerId },
        { session },
      );
    });
  } finally {
    session.endSession();
  }

  // Populate the order for socket notifications (outside transaction)
  const populatedOrder = await Order.findById(createdOrder._id)
    .populate({ path: "listingId", select: "farmAddress farmDistrict farmState", populate: { path: "cropId", select: "name" } })
    .populate("buyerId", "name phone")
    .populate("sellerId", "name phone");

  if (populatedOrder) {
    const cropName = (populatedOrder.listingId as any)?.cropId?.name ?? "Fasal";
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
          kisanName: kisan?.name ?? "",
          kisanPhone: kisan?.phone ?? "",
          buyerName: buyer?.name ?? "",
          buyerPhone: buyer?.phone ?? "",
          cropName,
          quantity: populatedOrder.quantity,
          unit: populatedOrder.unit,
          agreedPrice: populatedOrder.agreedPrice,
          totalAmount: populatedOrder.totalAmount,
          farmAddress: listing?.farmAddress ?? "",
          farmDistrict: listing?.farmDistrict ?? "",
          farmState: listing?.farmState ?? "",
          createdAt: populatedOrder.createdAt,
        },
        targetRole: "admin",
        targetUserId: null,
        orderId: populatedOrder._id.toString(),
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
          totalAmount: populatedOrder.totalAmount,
        },
        targetRole: "buyer",
        targetUserId: buyer?._id?.toString(),
        orderId: populatedOrder._id.toString(),
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
          totalAmount: populatedOrder.totalAmount,
        },
        targetRole: "kisan",
        targetUserId: kisan?._id?.toString(),
        orderId: populatedOrder._id.toString(),
      }),
    ]).catch((err) => {
      console.error("Notification creation failed:", err);
    });
  }

  res.status(200).json({
    success: true,
    message: "Deal confirm ho gayi",
    orderId: createdOrder._id,
    totalAmount: createdOrder.totalAmount,
    agreedPrice: createdOrder.agreedPrice,
    quantity: createdOrder.quantity,
  });
});

export const rejectInterest = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = req.user?.userId;
  const { id: listingId, interestId } = req.params;

  const listing = await Listing.findOne({ _id: listingId, sellerId })
    .populate<{ cropId: { name: string } }>("cropId", "name");
  if (!listing) throw new ApiError(404, "Listing not found or unauthorized");

  const interest = await Interest.findOne({ _id: interestId, listingId });
  if (!interest) throw new ApiError(404, "Interest not found");

  if (interest.status !== "pending") {
    throw new ApiError(400, `Interest is already ${interest.status}`);
  }

  interest.status = "rejected";
  await interest.save();

  // Check if other pending interests exist
  const otherPending = await Interest.exists({ listingId, status: "pending" });
  if (!otherPending && listing.status === "interest_received") {
    listing.status = "open";
    await listing.save();
  }

  // Notify the buyer their offer was rejected (fire-and-forget)
  const cropName = (listing.cropId as any)?.name ?? "Fasal";
  createAndEmitNotification({
    type: SOCKET_EVENTS.OFFER_REJECTED,
    message: `Aapka offer accept nahi hua: ${cropName}. Aap naya offer bhej sakte hain.`,
    payload: {
      listingId: listing._id.toString(),
      cropName,
      offeredPrice: interest.price,
    },
    targetRole: "buyer",
    targetUserId: interest.buyerId.toString(),
    listingId: listing._id.toString(),
  }).catch((err) => {
    console.error("Offer rejected notification failed:", err);
  });

  res.status(200).json({ success: true, message: "Interest rejected successfully" });
});

// ─── Buyer: Submit Interest ────────────────────────────────────────────────────
export const submitInterest = asyncHandler(async (req: Request, res: Response) => {
  const buyerId = req.user?.userId;
  const listingId = req.params.id as string;
  const { price, quantity, notes } = req.body;

  if (!buyerId) throw new ApiError(401, "Unauthorized");

  const listing = await Listing.findById(listingId)
    .populate<{ cropId: { name: string } }>("cropId", "name");
  if (!listing) throw new ApiError(404, "Listing not found");

  if (listing.status !== "open" && listing.status !== "interest_received") {
    throw new ApiError(400, "This listing is not accepting interests");
  }

  // Prevent duplicate pending interest from same buyer
  const existing = await Interest.findOne({ listingId, buyerId, status: "pending" });
  if (existing) {
    throw new ApiError(409, "You already have a pending interest on this listing");
  }

  const interest = await Interest.create({
    listingId: new mongoose.Types.ObjectId(listingId),
    buyerId: new mongoose.Types.ObjectId(buyerId),
    price,
    quantity: quantity ?? undefined,
    notes: notes || undefined,
    status: "pending",
  });

  // Update listing counters and status
  listing.interestedBuyerCount = (listing.interestedBuyerCount || 0) + 1;
  if (listing.status === "open") {
    listing.status = "interest_received";
  }
  await listing.save();

  // Notify the kisan a new offer arrived (fire-and-forget)
  const cropName = (listing.cropId as any)?.name ?? "Fasal";
  User.findById(buyerId)
    .select("name")
    .then((buyer) =>
      createAndEmitNotification({
        type: SOCKET_EVENTS.NEW_OFFER_RECEIVED,
        message: `Naya offer: ${cropName} — ₹${interest.price}/${listing.unit}${buyer?.name ? ` (${buyer.name})` : ""}`,
        payload: {
          listingId: listing._id.toString(),
          cropName,
          buyerName: buyer?.name ?? "",
          offeredPrice: interest.price,
          quantity: interest.quantity ?? listing.quantity,
          unit: listing.unit,
        },
        targetRole: "kisan",
        targetUserId: listing.sellerId.toString(),
        listingId: listing._id.toString(),
      }),
    )
    .catch((err) => {
      console.error("New offer notification failed:", err);
    });

  res.status(201).json({ success: true, data: interest });
});

// ─── Buyer: Withdraw a Pending Interest ───────────────────────────────────────
export const withdrawInterest = asyncHandler(async (req: Request, res: Response) => {
  const buyerId = req.user?.userId;
  if (!buyerId) throw new ApiError(401, 'Unauthorized');

  const { id: listingId, interestId } = req.params;

  const interest = await Interest.findOne({
    _id: interestId,
    listingId,
    buyerId,
    status: 'pending',
  });

  if (!interest) throw new ApiError(404, 'Pending interest not found or already processed');

  interest.status = 'withdrawn';
  await interest.save();

  const listing = await Listing.findById(listingId)
    .populate<{ cropId: { name: string } }>('cropId', 'name');

  if (listing) {
    listing.interestedBuyerCount = Math.max(0, (listing.interestedBuyerCount || 0) - 1);

    const otherPending = await Interest.exists({ listingId, status: 'pending' });
    if (!otherPending && listing.status === 'interest_received') {
      listing.status = 'open';
    }
    await listing.save();

    const cropName = (listing.cropId as any)?.name ?? 'Fasal';
    createAndEmitNotification({
      type: SOCKET_EVENTS.INTEREST_WITHDRAWN,
      message: `Ek buyer ne apna offer wapas le liya: ${cropName}`,
      payload: { listingId: listing._id.toString(), cropName },
      targetRole: 'kisan',
      targetUserId: listing.sellerId.toString(),
      listingId: listing._id.toString(),
    }).catch((err) => {
      console.error('Withdraw notification failed:', err);
    });
  }

  res.status(200).json({ success: true, message: 'Interest withdrawn successfully' });
});

// ─── Buyer: Get My Interest for a Listing ─────────────────────────────────────
export const getMyInterestForListing = asyncHandler(async (req: Request, res: Response) => {
  const buyerId = req.user?.userId;
  const listingId = req.params.id as string;

  if (!buyerId) throw new ApiError(401, "Unauthorized");

  // Return the most recent interest (there may be a rejected one + a new pending one)
  const interest = await Interest.findOne({ listingId, buyerId }).sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: interest || null });
});
