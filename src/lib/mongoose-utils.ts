export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Standardized pagination using Mongoose 9.11 native findAndCount and lean type narrowing
 */
export async function paginateQuery<T>(
  query: any,
  options: PaginationOptions = {}
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
  const skip = (page - 1) * limit;

  let data: T[];
  let total: number;

  if (typeof query.findAndCount === 'function') {
    const result = await query.skip(skip).limit(limit).lean().findAndCount();
    if (Array.isArray(result)) {
      [data, total] = result;
    } else if (result && typeof result === 'object') {
      data = (result.data || result.docs || []) as T[];
      total = Number(result.total || result.count || 0);
    } else {
      data = [] as T[];
      total = 0;
    }
  } else {
    const model = query.model;
    const filter = query.getFilter ? query.getFilter() : {};
    const [fetchedDocs, docCount] = await Promise.all([
      query.skip(skip).limit(limit).lean().exec(),
      model.countDocuments(filter).exec(),
    ]);
    data = fetchedDocs as T[];
    total = docCount;
  }

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
