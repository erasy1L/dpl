import { Button } from "../../../components/ui";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const AdminPagination = ({
  page,
  totalPages,
  onPageChange,
}: AdminPaginationProps) => {
  if (totalPages <= 1) return null;

  const maxVisible = 5;

  const getVisiblePages = (): number[] => {
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;

    if (end > totalPages) {
      end = totalPages;
      start = end - maxVisible + 1;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visiblePages = getVisiblePages();
  const showLeftEllipsis = visiblePages[0] > 1;
  const showRightEllipsis = visiblePages[visiblePages.length - 1] < totalPages;

  return (
    <div className="flex items-center justify-between pt-3">
      <Button
        size="sm"
        variant="outline"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Prev
      </Button>

      <div className="flex items-center gap-1">
        {showLeftEllipsis && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="px-2.5 py-1 rounded text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              1
            </button>
            <span className="px-1 text-gray-400">...</span>
          </>
        )}

        {visiblePages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-2.5 py-1 rounded text-sm ${
              p === page
                ? "bg-primary-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {p}
          </button>
        ))}

        {showRightEllipsis && (
          <>
            <span className="px-1 text-gray-400">...</span>
            <button
              onClick={() => onPageChange(totalPages)}
              className="px-2.5 py-1 rounded text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {totalPages}
            </button>
          </>
        )}
      </div>

      <Button
        size="sm"
        variant="outline"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
};

export default AdminPagination;

