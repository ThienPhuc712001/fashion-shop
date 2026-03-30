import { Request, Response, NextFunction } from 'express';

/**
 * Admin Settings Controller
 * Handles site-wide settings (could be stored in DB later)
 */
export const getAdminSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Placeholder settings - will be replaced with DB storage
    const settings = {
      siteName: 'Fashion Shop',
      siteDescription: 'Fashion E-commerce Platform',
      supportEmail: 'support@fashionshop.com',
      supportPhone: '0901234567',
      address: 'Vietnam',
      social: {
        facebook: '',
        instagram: '',
        twitter: ''
      },
      maintenanceMode: false,
      emailNotifications: true
    };

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Persist to database
    const updatedSettings = req.body;

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    next(error);
  }
};
