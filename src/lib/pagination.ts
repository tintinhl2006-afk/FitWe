/**
 * Page parameters for list endpoints.
 *
 * Several endpoints returned every row a user owns. The response shape stays a plain array so
 * the already-published mobile app keeps working; a client that sends no parameters now simply
 * gets the first page, and a client that gets a FULL page knows there may be more and asks for
 * `page + 1`.
 */
export interface PageParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function readPageParams(
  url: string,
  options: { defaultSize: number; maxSize: number }
): PageParams {
  const sp = new URL(url).searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
  const requested = parseInt(sp.get("pageSize") ?? "", 10);
  const wanted = Number.isFinite(requested) && requested > 0 ? requested : options.defaultSize;
  const pageSize = Math.min(options.maxSize, Math.max(1, wanted));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
