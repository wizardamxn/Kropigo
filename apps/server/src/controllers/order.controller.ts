import { Request, Response } from 'express';
import { Order } from '../models/Order.model';
import { getPaginationOptions } from '../utils/paginate';

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
      .populate('buyerId', 'name')
      .populate('sellerId', 'name')
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
