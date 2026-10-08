import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Compass,
  ArrowRight,
  TrendingUp,
  Layers,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import CareerComparisonModal, { type ComparisonCareer } from '../components/CareerComparisonModal';
import { API_BASE } from '../lib/api';

interface CareerListItem {
  title: string;
  slug: string;
  code: string;
  field: string;
  skills: string[];
  summary: string;
  education?: string;
  salary_india?: {
    entry: string;
    mid: string;
    senior: string;
  };
  is_curated?: boolean;
}

interface FieldCount {
  field: string;
  count: number;
}

export default function Careers() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [careers, setCareers] = useState<CareerListItem[]>([]);
  const [fields, setFields] = useState<FieldCount[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const initialSearch = searchParams.get('q') || '';
  const initialField = searchParams.get('field') || 'all';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialSort = searchParams.get('sort') || 'popular';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedField, setSelectedField] = useState(initialField);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [sortBy, setSortBy] = useState(initialSort);

  // Comparison State
  const [compareSlugs, setCompareSlugs] = useState<string[]>([]);
  const [comparisonDetails, setComparisonDetails] = useState<ComparisonCareer[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);

  // Sync state to URL params
  const updateUrl = (q: string, f: string, p: number, s: string) => {
    const params: Record<string, string> = {};
    if (q) params.q = q;
    if (f && f !== 'all') params.field = f;
    if (p > 1) params.page = p.toString();
    if (s && s !== 'popular') params.sort = s;
    setSearchParams(params);
  };

  // Fetch careers when query, field, page, or sort changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('q', searchQuery.trim());
    if (selectedField !== 'all') params.append('field', selectedField);
    params.append('page', currentPage.toString());
    params.append('limit', '24');
    params.append('sort', sortBy);

    fetch(`${API_BASE}/api/careers?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch careers');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setCareers(data.careers || []);
          setTotal(data.total || 0);
          setTotalPages(data.total_pages || 1);
          if (data.fields && data.fields.length > 0) {
            setFields(data.fields);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Error fetching careers:', err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [searchQuery, selectedField, currentPage, sortBy]);

  // Handle Search Input submit / debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setCurrentPage(1);
    updateUrl(val, selectedField, 1, sortBy);
  };

  const handleFieldSelect = (fieldKey: string) => {
    setSelectedField(fieldKey);
    setCurrentPage(1);
    updateUrl(searchQuery, fieldKey, 1, sortBy);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSortBy(val);
    setCurrentPage(1);
    updateUrl(searchQuery, selectedField, 1, val);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    updateUrl(searchQuery, selectedField, newPage, sortBy);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toggle career in compare list
  const toggleCompare = (slug: string) => {
    setCompareSlugs((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      }
      if (prev.length >= 3) {
        alert('You can compare a maximum of 3 careers at once.');
        return prev;
      }
      return [...prev, slug];
    });
  };

  const removeCompareSlug = (slug: string) => {
    setCompareSlugs((prev) => prev.filter((s) => s !== slug));
    setComparisonDetails((prev) => prev.filter((c) => c.slug !== slug));
  };

  // Open Compare Modal
  const handleOpenCompareModal = async () => {
    if (compareSlugs.length === 0) return;
    setCompareLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/careers/compare?slugs=${compareSlugs.join(',')}`);
      if (res.ok) {
        const data = await res.json();
        setComparisonDetails(data.careers || []);
        setIsCompareModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to load comparison data:', err);
    } finally {
      setCompareLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-28">
      <AppHeader />

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-purple-900 via-indigo-900 to-slate-900 text-white py-14 px-6 border-b border-purple-800/40">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-400/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-purple-200 mb-4 backdrop-blur-md">
            <Compass className="w-4 h-4 text-purple-300" />
            O*NET 31.0 Database (1,000+ Careers)
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Explore & Compare Career Paths
          </h1>
          <p className="mt-3 text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Browse real-world job roles, inspect verified Indian salary brackets (₹ LPA), analyze
            required competencies, and compare up to 3 careers side by side.
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl mx-auto relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by job title, skill (e.g. Python, SQL), or domain..."
              className="w-full pl-12 pr-10 py-3.5 bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-purple-500/30 text-sm font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                  updateUrl('', selectedField, 1, sortBy);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-6 mt-8">
        {/* Filter Chips & Sort Controls */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <SlidersHorizontal className="w-4 h-4 text-purple-600" />
              Filter by Industry Field
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-500 font-semibold">Sort by:</span>
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="popular">Recommended / Popular</option>
                <option value="title_asc">Title (A - Z)</option>
                <option value="title_desc">Title (Z - A)</option>
              </select>
            </div>
          </div>

          {/* Field Category Pills */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => handleFieldSelect('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedField === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Careers ({total || 1056})
            </button>

            {fields.map((f) => (
              <button
                key={f.field}
                onClick={() => handleFieldSelect(f.field)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedField.toLowerCase() === f.field.toLowerCase()
                    ? 'bg-purple-600 text-white shadow-sm font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.field} <span className="opacity-60 ml-0.5 text-[11px]">({f.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs sm:text-sm font-semibold text-slate-500">
            Showing <span className="text-slate-800 font-bold">{careers.length}</span> of{' '}
            <span className="text-slate-800 font-bold">{total}</span> careers
            {selectedField !== 'all' && (
              <span>
                {' '}
                in <span className="text-purple-600 font-bold">{selectedField}</span>
              </span>
            )}
            {searchQuery && (
              <span>
                {' '}
                matching "<span className="text-purple-600 font-bold">{searchQuery}</span>"
              </span>
            )}
          </p>

          {compareSlugs.length > 0 && (
            <button
              onClick={() => setCompareSlugs([])}
              className="text-xs text-red-600 hover:underline font-semibold"
            >
              Clear Comparison ({compareSlugs.length})
            </button>
          )}
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-xs font-semibold text-slate-500">
              Searching career knowledge base...
            </p>
          </div>
        ) : careers.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto my-12">
            <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No careers found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              We couldn't find any career matching "{searchQuery}". Try searching for broader terms
              like "engineer", "analyst", or "designer".
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedField('all');
                setCurrentPage(1);
                updateUrl('', 'all', 1, 'popular');
              }}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Career Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {careers.map((career) => {
              const isSelectedForCompare = compareSlugs.includes(career.slug);

              return (
                <div
                  key={career.slug}
                  className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all hover:shadow-md ${
                    isSelectedForCompare
                      ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/20'
                      : 'border-slate-200/90 hover:border-purple-300'
                  }`}
                >
                  <div>
                    {/* Field & Holland Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 truncate max-w-[170px]">
                        {career.field}
                      </span>
                      {career.code && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          {career.code}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-black text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                      {career.title}
                    </h3>

                    {/* Summary */}
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {career.summary}
                    </p>

                    {/* Estimated Salary */}
                    <div className="mt-3.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1 text-[11px] font-medium">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        Mid-Level (India):
                      </span>
                      <span className="font-bold text-slate-800 text-[11px]">
                        {career.salary_india?.mid || '₹10 - ₹18 LPA'}
                      </span>
                    </div>

                    {/* Skills Chips */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {career.skills?.slice(0, 3).map((s, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => toggleCompare(career.slug)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSelectedForCompare
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isSelectedForCompare ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Comparing
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" /> Compare
                        </>
                      )}
                    </button>

                    <Link
                      to={`/careers/${career.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors"
                    >
                      Explore Details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && !loading && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold text-slate-600 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Floating Compare Drawer (Sticky Bottom) */}
      {compareSlugs.length > 0 && (
        <div className="fixed bottom-6 inset-x-0 z-40 max-w-2xl mx-auto px-4">
          <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-slate-700 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              <span className="text-xs font-bold text-slate-400 shrink-0 hidden sm:inline">
                Compare ({compareSlugs.length}/3):
              </span>
              {compareSlugs.map((slug) => {
                const found = careers.find((c) => c.slug === slug);
                const title = found ? found.title : slug;
                return (
                  <div
                    key={slug}
                    className="inline-flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0"
                  >
                    <span className="truncate max-w-[120px]">{title}</span>
                    <button
                      onClick={() => removeCompareSlug(slug)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleOpenCompareModal}
                disabled={compareLoading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                <Layers className="w-3.5 h-3.5" />
                {compareLoading ? 'Loading...' : `Compare (${compareSlugs.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      <CareerComparisonModal
        careers={comparisonDetails}
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        onRemove={removeCompareSlug}
      />
    </div>
  );
}
