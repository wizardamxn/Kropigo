import { Request, Response } from 'express';
import { Crop } from '../models/Crop.model';

export const getCrops = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, page = '1', limit = '6' } = req.query;
    const limitNumber = parseInt(limit as string, 10);
    const skipNumber = (parseInt(page as string, 10) - 1) * limitNumber;

    const pipeline: any[] = [];

    if (search) {
      pipeline.push({
        $search: {
          index: "default",
          text: {
            query: search as string,
            path: ["name", "nameHindi"],
            fuzzy: {
              maxEdits: 1,
              prefixLength: 1
            }
          }
        }
      });
    }

    const matchStage: any = { isActive: true };
    if (category) {
      matchStage.category = category;
    }
    pipeline.push({ $match: matchStage });

    if (!search) {
      pipeline.push({ $sort: { name: 1 } });
    }

    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skipNumber }, { $limit: limitNumber }]
      }
    });

    const result = await Crop.aggregate(pipeline);
    const totalCrops = result[0].metadata[0]?.total || 0;
    const crops = result[0].data;

    res.status(200).json({
      success: true,
      data: crops,
      pagination: {
        total: totalCrops,
        page: parseInt(page as string, 10),
        limit: limitNumber,
        totalPages: Math.ceil(totalCrops / limitNumber)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
