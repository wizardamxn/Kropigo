import { Request, Response } from 'express';
import { Crop } from '../models/Crop.model';
import { asyncHandler } from '../utils/asyncHandler';

export const getCrops = asyncHandler(async (req: Request, res: Response) => {
  const { category, search, page = '1', limit = '6' } = req.query;
  const limitNumber = parseInt(limit as string, 10);
  const skipNumber = (parseInt(page as string, 10) - 1) * limitNumber;

  let result: any[] = [];
  let usedFallback = false;

    // 1. Try Atlas Search first if a search query is provided
    if (search) {
      try {
        const pipeline: any[] = [
          {
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
          }
        ];

        const matchStage: any = { isActive: { $ne: false } };
        if (category) {
          matchStage.category = category;
        }
        pipeline.push({ $match: matchStage });

        pipeline.push({
          $facet: {
            metadata: [{ $count: "total" }],
            data: [{ $skip: skipNumber }, { $limit: limitNumber }]
          }
        });

        result = await Crop.aggregate(pipeline);
        
        // If result is empty or didn't fetch properly, check if we need to fall back
        if (!result || result.length === 0 || !result[0].metadata) {
          throw new Error("Invalid Atlas Search aggregation result format");
        }
      } catch (searchError: any) {
        console.warn("⚠️ Atlas Search failed or index not found in production. Falling back to regex search:", searchError.message);
        usedFallback = true;
      }
    }

    // 2. Standard / Fallback Pipeline (Uses robust local Regex pattern matching)
    if (!search || usedFallback) {
      const pipeline: any[] = [];
      const matchStage: any = { isActive: { $ne: false } };

      if (category) {
        matchStage.category = category;
      }

      if (search) {
        const searchRegex = new RegExp(search as string, 'i');
        matchStage.$or = [
          { name: searchRegex },
          { nameHindi: searchRegex }
        ];
      }

      pipeline.push({ $match: matchStage });
      pipeline.push({ $sort: { name: 1 } });
      pipeline.push({
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skipNumber }, { $limit: limitNumber }]
        }
      });

      result = await Crop.aggregate(pipeline);
    }

    const totalCrops = result && result[0] && result[0].metadata && result[0].metadata[0]
      ? result[0].metadata[0].total
      : 0;
    const crops = result && result[0] ? result[0].data : [];

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
});
