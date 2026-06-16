import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Button from './Button';

interface PaginationProps {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
}

export default function Pagination({
  current,
  pageSize,
  total,
  onChange,
  showSizeChanger = true,
  pageSizeOptions = [10, 20, 50, 100],
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5;
    
    if (totalPages <= showPages + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 3) {
        for (let i = 1; i <= showPages; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (current >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - showPages + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-dark-200 rounded-b-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm text-dark-600">
          共 <span className="font-medium">{total}</span> 条记录
        </span>
        {showSizeChanger && (
          <select
            value={pageSize}
            onChange={(e) => onChange(1, Number(e.target.value))}
            className="ml-2 px-2 py-1 text-sm border border-dark-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} 条/页
              </option>
            ))}
          </select>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={current === 1}
          onClick={() => onChange(1, pageSize)}
          icon={<ChevronsLeft size={16} />}
        />
        <Button
          variant="ghost"
          size="sm"
          disabled={current === 1}
          onClick={() => onChange(current - 1, pageSize)}
          icon={<ChevronLeft size={16} />}
        />
        
        {pages.map((page, index) => (
          typeof page === 'number' ? (
            <Button
              key={index}
              variant={page === current ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => onChange(page, pageSize)}
            >
              {page}
            </Button>
          ) : (
            <span key={index} className="px-2 text-dark-400">
              {page}
            </span>
          )
        ))}
        
        <Button
          variant="ghost"
          size="sm"
          disabled={current === totalPages || totalPages === 0}
          onClick={() => onChange(current + 1, pageSize)}
          icon={<ChevronRight size={16} />}
        />
        <Button
          variant="ghost"
          size="sm"
          disabled={current === totalPages || totalPages === 0}
          onClick={() => onChange(totalPages, pageSize)}
          icon={<ChevronsRight size={16} />}
        />
      </div>
    </div>
  );
}
