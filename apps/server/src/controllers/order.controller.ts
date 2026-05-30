import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order.model';
import { getPaginationOptions } from '../utils/paginate';
import { createAndEmitNotification } from '../services/socket.service';
import { SOCKET_EVENTS } from '../utils/socketEvents';

// ─── State machine: valid order status transitions ────────────────────────────
const VALID_TRANSITIONS: Record<string, string[]> = {
  sale_confirmed:   ['admin_notified'],
  admin_notified:   ['qc_scheduled'],
  qc_scheduled:     ['qc_passed', 'qc_failed'],
  qc_passed:        ['pickup_scheduled'],
  qc_failed:        [],
  pickup_scheduled: ['in_transit'],
  in_transit:       ['delivered'],
  delivered:        []
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const { status, district, startDate, endDate } = req.query;
    const { skip, limit, page } = getPaginationOptions(req);

    const filter: any = {};

    // Role-aware filtering — one endpoint serves all roles
    if (req.user?.role === 'kisan') {
      filter.sellerId = req.user.userId;
    } else if (req.user?.role === 'buyer') {
      filter.buyerId = req.user.userId;
    } else if (req.user?.role === 'admin') {
      // no filter — admin sees all
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate as string);
        if (endDate) filter.createdAt.$lte = new Date(endDate as string);
      }
    } else {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }

    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('buyerId', 'name phone profilePhoto')
        .populate('sellerId', 'name phone profilePhoto')
        .populate({
          path: 'listingId',
          populate: { path: 'cropId', select: 'name nameHindi' },
          select: 'cropId mediaUrls farmAddress farmDistrict farmState'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({
        path: 'listingId',
        select: 'cropId mediaUrls farmAddress farmDistrict farmState',
        populate: { path: 'cropId', select: 'name category unit' }
      })
      .populate('buyerId', 'name phone email location isVerified profilePhoto')
      .populate('sellerId', 'name phone email location isVerified profilePhoto')
      .populate('interestId', 'price quantity notes');

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Authorization check — only involved parties or admin can view
    const userId = req.user?.userId;
    const isInvolved = 
      order.buyerId._id.toString() === userId ||
      order.sellerId._id.toString() === userId ||
      req.user?.role === 'admin';

    if (!isInvolved) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: order 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Admin: Update Order Status ───────────────────────────────────────────────
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    // Step 1 — Validate request body (Zod middleware already ran, but guard anyway)
    if (!status) {
      res.status(400).json({ success: false, message: 'Status is required' });
      return;
    }

    // Step 2 — Fetch the order with populated buyer and seller
    const order = await Order.findById(id)
      .populate<{ buyerId: { _id: mongoose.Types.ObjectId; name: string } }>('buyerId', '_id name')
      .populate<{ sellerId: { _id: mongoose.Types.ObjectId; name: string } }>('sellerId', '_id name')
      .populate<{ listingId: { cropId: { name: string } } }>({
        path: 'listingId',
        populate: { path: 'cropId', select: 'name' },
        select: 'cropId'
      });

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    // Step 3 — Check current status is not terminal
    if (['qc_failed', 'delivered'].includes(order.status)) {
      res.status(400).json({
        success: false,
        message: `Order is in terminal state '${order.status}' and cannot be updated`
      });
      return;
    }

    // Step 4 — Validate the transition is legal
    const allowedNextStatuses = VALID_TRANSITIONS[order.status] || [];
    if (!allowedNextStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Cannot transition from '${order.status}' to '${status}'. Allowed: ${allowedNextStatuses.join(', ') || 'none'}`
      });
      return;
    }

    // Step 5 — Build the timeline entry
    const timelineEntry = {
      status,
      timestamp: new Date(),
      actorId: new mongoose.Types.ObjectId(req.user!.userId),
      note: note?.trim() || null
    };

    // Step 6 — Update the order atomically
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        $set: { status },
        $push: { timeline: timelineEntry }
      },
      { new: true }
    )
      .populate('buyerId', '_id name')
      .populate('sellerId', '_id name')
      .populate({
        path: 'listingId',
        populate: { path: 'cropId', select: 'name' },
        select: 'cropId farmAddress farmDistrict farmState'
      });

    if (!updatedOrder) {
      res.status(500).json({ success: false, message: 'Failed to update order' });
      return;
    }

    // Step 7 — Build notification messages per status
    const STATUS_MESSAGES: Record<string, { buyer: string; kisan: string }> = {
      admin_notified: {
        buyer: 'Aapke deal ko hamari team ne receive kar liya hai. Jald karyawahi hogi.',
        kisan: 'Hamari team ne aapki deal note kar li hai. Jald contact karenge.'
      },
      qc_scheduled: {
        buyer: 'Quality check schedule ho gayi hai. Hamari team kisan ke farm visit karegi.',
        kisan: 'Hamari team jald aapke farm visit karegi quality check ke liye.'
      },
      qc_passed: {
        buyer: 'Quality check pass ho gayi! Aapka order pickup ke liye ready hai.',
        kisan: 'Quality check pass ho gayi. Pickup jald schedule hogi.'
      },
      qc_failed: {
        buyer: 'Quality check fail ho gayi. Hamari team details ke saath contact karegi. Refund process hoga.',
        kisan: 'Quality check mein issue aaya. Hamari team aapko contact karegi.'
      },
      pickup_scheduled: {
        buyer: 'Aapka order pickup schedule ho gaya hai.',
        kisan: 'Pickup schedule ho gayi hai. Transport on the way.'
      },
      in_transit: {
        buyer: 'Aapka order pickup ho gaya aur raste mein hai.',
        kisan: 'Aapki fasal pickup ho gayi aur delivery ke liye nikal gayi.'
      },
      delivered: {
        buyer: 'Aapka order deliver ho gaya! Please confirm karein.',
        kisan: 'Aapki fasal deliver ho gayi. Payment process shuru hoga.'
      }
    };

    const messages = STATUS_MESSAGES[status];
    const cropName = (updatedOrder.listingId as any)?.cropId?.name || 'Fasal';
    const buyer = updatedOrder.buyerId as any;
    const kisan = updatedOrder.sellerId as any;

    const notificationPayload = {
      orderId: updatedOrder._id.toString(),
      status,
      note: note?.trim() || null,
      timestamp: timelineEntry.timestamp,
      cropName
    };

    // Step 8 — Fire notifications to buyer and kisan in parallel (fire-and-forget)
    Promise.all([
      createAndEmitNotification({
        type: SOCKET_EVENTS.ORDER_STATUS_UPDATED,
        message: messages.buyer,
        payload: notificationPayload,
        targetRole: 'buyer',
        targetUserId: buyer._id.toString(),
        orderId: updatedOrder._id.toString()
      }),
      createAndEmitNotification({
        type: SOCKET_EVENTS.ORDER_STATUS_UPDATED,
        message: messages.kisan,
        payload: notificationPayload,
        targetRole: 'kisan',
        targetUserId: kisan._id.toString(),
        orderId: updatedOrder._id.toString()
      })
    ]).catch((err) => {
      console.error('Order status notification failed:', err);
    });

    res.status(200).json({
      success: true,
      message: `Order status updated to '${status}'`,
      data: updatedOrder
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
