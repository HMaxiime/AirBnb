import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Spinner } from "../../../shared/components/Spinner";
import { List } from "../../../shared/components/List";
import { Card } from "../components/Card";
import { useListings } from "../hooks/useListings";
import { useAISearch } from "../hooks/useAISearch";
import { useStore } from "../../../store/StoreContext";
import { useFavorites } from "../hooks/useFavorites";
import { ExtendedListing } from "../../../lib/api";
import styles from "../components/ListingCard.module.css";
import "./ListingsPage.css";

const CATEGORIES = [
  { value: "all",       label: "All stays"  },
  { value: "house",     label: "House"      },
  { value: "apartment", label: "Apartment"  },
  { value: "villa",     label: "Villa"      },
];

const RATINGS = [
  { value: 0,   label: "Any"    },
  { value: 3,   label: "3+ ★"  },
  { value: 4,   label: "4+ ★"  },
  { value: 4.5, label: "4.5+ ★"},
];

interface Filters {
  category: string;
  minRating: number;
}

const DEFAULT: Filters = { category: "all", minRating: 0 };

export function ListingsPage(): React.JSX.Element {
  const [filters, setFilters] = useState<Filters>(DEFAULT);
  const [savedOnly, setSavedOnly] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [aiQuery, setAiQuery] = useState("");

  const { data: listings = [], isLoading, isError, isFetching, refetch } = useListings();
  const { mutate: runAISearch, data: aiResult, isPending: aiLoading, reset: clearAI } = useAISearch();
  const { state, dispatch } = useStore();
  const { count } = useFavorites();
  const aiInputRef = useRef<HTMLInputElement>(null);

  const isAIMode = !!aiResult;

  const handleAISearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (aiQuery.trim()) runAISearch(aiQuery.trim());
  };

  const handleClearAI = () => {
    clearAI();
    setAiQuery("");
  };

  const set = (patch: Partial<Filters>): void => setFilters((f) => ({ ...f, ...patch }));

  const filteredListings = useMemo<ExtendedListing[]>(() => {
    if (isAIMode) return aiResult.results;
    let r = listings;
    if (state.filter.trim()) {
      const q = state.filter.toLowerCase();
      r = r.filter((l) => l.title.toLowerCase().includes(q) || l.location.toLowerCase().includes(q));
    }
    if (filters.category !== "all") r = r.filter((l) => l.category === filters.category);
    if (filters.minRating > 0)      r = r.filter((l) => l.rating >= filters.minRating);
    if (savedOnly)                  r = r.filter((l) => state.saved.includes(l.id));
    return r;
  }, [listings, aiResult, isAIMode, state.filter, state.saved, filters, savedOnly]);

  const hasActive = filters.category !== "all" || filters.minRating > 0 || savedOnly;

  const resetAll = useCallback((): void => {
    dispatch({ type: "RESET" });
    setFilters(DEFAULT);
    setSavedOnly(false);
  }, [dispatch]);

  const sidebarContent = (
    <>
      <div className="filter-sidebar-header">
        <span className="filter-sidebar-title">Filters</span>
        {hasActive && <button className="filter-clear-btn" onClick={resetAll}>Clear all</button>}
      </div>

      <div className="filter-section">
        <button
          onClick={() => setSavedOnly((v) => !v)}
          className={`filter-cat-btn${savedOnly ? " active" : ""}`}
        >
          ♡ Saved{count > 0 ? ` (${count})` : ""}
        </button>
      </div>

      <div className="filter-section">
        <p className="filter-label">Category</p>
        {CATEGORIES.map((c) => (
          <button key={c.value} onClick={() => set({ category: c.value })}
            className={`filter-cat-btn${filters.category === c.value ? " active" : ""}`}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="filter-section">
        <p className="filter-label">Min rating</p>
        <div className="filter-pill-row">
          {RATINGS.map((r) => (
            <button key={r.value} onClick={() => set({ minRating: r.value })}
              className={`filter-pill${filters.minRating === r.value ? " active" : ""}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const sidebar = (
    <aside className="filter-sidebar">
      <div className="filter-sidebar-inner">{sidebarContent}</div>
    </aside>
  );

  if (isLoading) {
    return (
      <div className="listings-page">
        {sidebar}
        <main className="listings-main"><Spinner /></main>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="listings-page">
        {sidebar}
        <main className="listings-main">
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <h2 className="empty-state-title">Failed to load listings</h2>
            <button onClick={() => refetch()} className="reset-button" style={{ marginTop: 16 }}>Retry</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="listings-page">
      {sidebar}

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="filter-drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="filter-drawer" onClick={(e) => e.stopPropagation()}>
            <button className="filter-drawer-close" onClick={() => setDrawerOpen(false)}>✕</button>
            {sidebarContent}
          </div>
        </div>
      )}

      <main className="listings-main">
        {/* AI Search Bar */}
        <form onSubmit={handleAISearch} className="ai-search-bar">
          <div className="ai-search-icon">✦</div>
          <input
            ref={aiInputRef}
            type="text"
            className="ai-search-input"
            placeholder="Ask AI — e.g. cozy house for 4 people under $200/night in Paris"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            disabled={aiLoading}
          />
          {isAIMode ? (
            <button type="button" onClick={handleClearAI} className="ai-clear-btn">
              Clear
            </button>
          ) : (
            <button type="submit" className="ai-submit-btn" disabled={aiLoading || !aiQuery.trim()}>
              {aiLoading ? "Searching…" : "Search"}
            </button>
          )}
        </form>

        {/* AI result context */}
        {isAIMode && (
          <div className="ai-result-banner">
            <span className="ai-result-label">✦ AI results for "{aiResult.query}"</span>
            <div className="ai-tags">
              {aiResult.extractedFilters.location && (
                <span className="ai-tag">📍 {aiResult.extractedFilters.location}</span>
              )}
              {aiResult.extractedFilters.type && (
                <span className="ai-tag">🏠 {aiResult.extractedFilters.type.toLowerCase()}</span>
              )}
              {aiResult.extractedFilters.guests && (
                <span className="ai-tag">👥 {aiResult.extractedFilters.guests}+ guests</span>
              )}
              {aiResult.extractedFilters.maxPrice && (
                <span className="ai-tag">💰 max ${aiResult.extractedFilters.maxPrice}/night</span>
              )}
            </div>
          </div>
        )}

        <div className="listings-controls">
          {!isAIMode && isFetching && <p style={{ color: "#ff5a5f", fontSize: 13, margin: 0 }}>Refreshing…</p>}
          <p className="results-count">
            <strong>{filteredListings.length}</strong> {filteredListings.length === 1 ? "listing" : "listings"}
          </p>
          {!isAIMode && (
            <button className="filter-mobile-btn" onClick={() => setDrawerOpen(true)}>
              ⚙ Filters {hasActive && <span className="filter-dot" />}
            </button>
          )}
        </div>

        <List<ExtendedListing>
          items={filteredListings}
          keyExtractor={(l) => l.id}
          emptyMessage="No listings match your filters."
          className="listings-grid"
          renderItem={(listing) => (
            <Card listing={listing}>
              <Card.Image />
              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <Card.Title />
                  <Card.Rating />
                </div>
                <Card.Location />
                <div className={styles.cardFooter}>
                  <Card.Price />
                  <Card.Badge />
                </div>
              </div>
            </Card>
          )}
        />
      </main>
    </div>
  );
}
