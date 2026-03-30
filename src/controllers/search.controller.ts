import { Request, Response, NextFunction } from 'express';
import searchService from '../services/search.service';

// GET /api/products/search?q=query&limit=20&offset=0&category_id=
export const searchProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, limit = 20, offset = 0, category_id, min_price, max_price } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query (q) is required and must be at least 2 characters'
      });
    }

    const results = await searchService.searchProducts(q as string, {
      limit: Number(limit),
      offset: Number(offset),
      category_id: category_id as string,
      min_price: min_price ? Number(min_price) : undefined,
      max_price: max_price ? Number(max_price) : undefined
    });

    // Also get total count for pagination (approximate)
    const totalCount = await searchService.searchProducts(q as string, { limit: 1000 });
    const total = totalCount.length;

    res.json({
      success: true,
      query: q,
      data: results,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/suggestions?q=prefix (autocomplete)
export const getSuggestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 1) {
      return res.json({ success: true, data: [] });
    }

    const suggestions = await searchService.getSuggestions(q as string, Number(limit));

    res.json({
      success: true,
      data: suggestions
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/search/rebuild (admin) - Rebuild FTS index
export const rebuildIndex = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = (req as any).user?.role;
    if (userRole !== 'admin') {
      throw new Error('Admin only');
    }

    const result = await searchService.rebuildIndex();

    res.json({
      success: true,
      message: `FTS index rebuilt with ${result.indexed} products`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
