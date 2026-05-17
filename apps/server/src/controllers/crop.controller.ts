import { Request, Response } from 'express';
import { Crop } from '../models/Crop.model';

export const getCrops = async (req: Request, res: Response): Promise<void> => {
  try {
    const crops = await Crop.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, data: crops });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
