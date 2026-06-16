import { Request, Response } from 'express';
import { SiteSettings } from '../models/SiteSettings.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';

export const getLaunchStatus = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await SiteSettings.findOne({ key: 'launch' });
  res.json(new ApiResponse(200, { isLaunched: settings?.isLaunched ?? false }));
});

export const triggerLaunch = asyncHandler(async (_req: Request, res: Response) => {
  await SiteSettings.findOneAndUpdate(
    { key: 'launch' },
    { isLaunched: true, launchedAt: new Date() },
    { upsert: true, new: true }
  );
  res.json(new ApiResponse(200, { isLaunched: true }, 'Site launched successfully'));
});

export const resetLaunch = asyncHandler(async (_req: Request, res: Response) => {
  await SiteSettings.findOneAndUpdate(
    { key: 'launch' },
    { isLaunched: false, $unset: { launchedAt: '' } },
    { upsert: true, new: true }
  );
  res.json(new ApiResponse(200, { isLaunched: false }, 'Launch reset successfully'));
});
