export function resolvePagination({ page, count }): {
  startIndex: number;
  endIndex: number;
} {
  const currentPage = Math.max(1, page);
  const itemsPerPage = Math.max(1, count);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = currentPage * itemsPerPage;

  return { startIndex, endIndex };
}
