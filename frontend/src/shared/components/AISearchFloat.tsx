import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAISearch } from "../../features/listings/hooks/useAISearch";
import "./AISearchFloat.css";

export function AISearchFloat() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { mutate: search, data: result, isPending: loading, reset } = useAISearch();

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleClose = () => {
    setOpen(false);
    setQuery("");
    reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) search(query.trim());
  };

  const handleResultClick = (id: string) => {
    handleClose();
    navigate(`/listings/${id}`);
  };

  return (
    <>
      <button
        className={`ai-fab${open ? " ai-fab--open" : ""}`}
        onClick={() => (open ? handleClose() : setOpen(true))}
        aria-label="AI Search"
      >
        {open ? "✕" : "✦"}
      </button>

      {open && (
        <>
          <div className="ai-float-overlay" onClick={handleClose} />

          <div className="ai-float-modal">
            <div className="ai-float-header">
              <span className="ai-float-title">✦ AI Search</span>
              <p className="ai-float-subtitle">Describe what you're looking for in plain English</p>
            </div>

            <form onSubmit={handleSubmit} className="ai-float-form">
              <input
                ref={inputRef}
                type="text"
                className="ai-float-input"
                placeholder='e.g. "beach house for 4 people under $200 in Miami"'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="ai-float-submit"
                disabled={loading || !query.trim()}
              >
                {loading ? <span className="ai-float-spinner" /> : "Search"}
              </button>
            </form>

            {result && !loading && !result.offTopic && Object.keys(result.extractedFilters).length > 0 && (
              <div className="ai-float-tags">
                {result.extractedFilters.location && (
                  <span className="ai-float-tag">Location: {result.extractedFilters.location}</span>
                )}
                {result.extractedFilters.type && (
                  <span className="ai-float-tag">Type: {result.extractedFilters.type.charAt(0) + result.extractedFilters.type.slice(1).toLowerCase()}</span>
                )}
                {result.extractedFilters.guests && (
                  <span className="ai-float-tag">{result.extractedFilters.guests}+ guests</span>
                )}
                {result.extractedFilters.maxPrice && (
                  <span className="ai-float-tag">Max ${result.extractedFilters.maxPrice}/night</span>
                )}
                {result.extractedFilters.amenities?.map((a) => (
                  <span key={a} className="ai-float-tag">{a}</span>
                ))}
              </div>
            )}

            {loading && (
              <div className="ai-float-loading">
                <span className="ai-float-spinner" />
                <span>Searching available properties…</span>
              </div>
            )}

            {result && !loading && (
              <div className="ai-float-results">
                {result.offTopic ? (
                  <p className="ai-float-empty">{result.message}</p>
                ) : result.count === 0 ? (
                  <p className="ai-float-empty">No properties found matching your request. Try adjusting your search.</p>
                ) : (
                  <>
                    <p className="ai-float-count">{result.count} propert{result.count !== 1 ? "ies" : "y"} found</p>
                    {result.results.map((listing) => (
                      <button
                        key={listing.id}
                        className="ai-float-result"
                        onClick={() => handleResultClick(listing.id)}
                      >
                        {listing.img ? (
                          <img
                            src={listing.img}
                            alt={listing.title}
                            className="ai-float-result-img"
                          />
                        ) : (
                          <div className="ai-float-result-img ai-float-result-placeholder" />
                        )}
                        <div className="ai-float-result-info">
                          <p className="ai-float-result-title">{listing.title}</p>
                          <p className="ai-float-result-location">{listing.location}</p>
                          <p className="ai-float-result-price">${listing.price}<span>/night</span></p>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="ai-float-result-arrow">
                          <path d="M9 18l6-6-6-6"/>
                        </svg>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}

          </div>
        </>
      )}
    </>
  );
}
