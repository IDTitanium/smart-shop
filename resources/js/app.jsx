// resources/js/app.jsx
//
// Install dependencies:
//   npm install react react-dom axios
//   npm install -D @vitejs/plugin-react
//
// vite.config.js:
//   import react from '@vitejs/plugin-react';
//   export default defineConfig({
//     plugins: [react(), laravel({ input: ['resources/js/app.jsx'], refresh: true })],
//   });
//
// resources/views/search.blade.php:
//   <!DOCTYPE html>
//   <html lang="en">
//   <head>
//       <meta charset="UTF-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <title>SmartShop - AI Product Search</title>
//       @viteReactRefresh
//       @vite(['resources/js/app.jsx'])
//   </head>
//   <body>
//       <div id="root"></div>
//   </body>
//   </html>
//
// routes/web.php:
//   Route::get('/', fn () => view('search'));
//   Route::get('/{any}', fn () => view('search'))->where('any', '.*');

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';

// ── Configure axios defaults ────────────────────────────────
axios.defaults.baseURL = '/api';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Grab CSRF token from cookie (Laravel Sanctum / default)
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('XSRF-TOKEN='))
  ?.split('=')[1];
if (csrfToken) {
  axios.defaults.headers.common['X-XSRF-TOKEN'] = decodeURIComponent(csrfToken);
}

// ── Components ──────────────────────────────────────────────

function StarRating({ rating }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.3;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {[...Array(5)].map((_, i) => (
        <span key={i} style={{ color: i < full ? '#F59E0B' : (i === full && half) ? '#F59E0B' : '#D1D5DB', fontSize: 14 }}>
          {i < full ? '★' : (i === full && half) ? '★' : '☆'}
        </span>
      ))}
      <span style={{ color: '#6B7280', fontSize: 13, marginLeft: 4 }}>{rating}</span>
    </div>
  );
}

function ProductCard({ product, idx }) {
  const categoryEmoji = {
    Electronics: '🔌', Computers: '💻', Gaming: '🎮', 'Smart Home': '🏠',
    Kitchen: '🍳', Fitness: '💪', Health: '❤️', Wearables: '⌚',
    Outdoors: '🏔️', Clothing: '👕', Shoes: '👟', Travel: '🧳',
    Office: '🖊️', 'Personal Care': '✨', Pets: '🐾', Auto: '🚗',
    'Musical Instruments': '🎵', Garden: '🌱', Baby: '👶', Toys: '🧸',
    Crafts: '✂️', Accessories: '👜',
  };
  const emoji = categoryEmoji[product.category] || '📦';

  return (
    <div
      style={{
        background: 'white', borderRadius: 12, border: '1px solid #E5E7EB',
        padding: 20, display: 'flex', gap: 20, transition: 'all 0.2s ease',
        cursor: 'pointer', animation: `fadeSlideIn 0.3s ease ${idx * 0.04}s both`,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = '#C7D2FE'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
    >
      {/* Product image or emoji fallback */}
      <div style={{
        width: 100, minWidth: 100, height: 100,
        background: 'linear-gradient(135deg, #F0F4FF, #E8ECFF)',
        borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 42, overflow: 'hidden',
      }}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
        ) : emoji}
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>
          {product.name}
        </h3>
        <StarRating rating={product.rating} />
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9CA3AF' }}>
          {(product.reviews_count || 0).toLocaleString()} ratings
        </p>
        <p style={{
          margin: '6px 0 0', fontSize: 13, color: '#6B7280', lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {product.description}
        </p>
        {product.category && (
          <span style={{
            display: 'inline-block', marginTop: 6, padding: '2px 8px',
            background: '#F3F4F6', borderRadius: 4, fontSize: 11, color: '#6B7280',
          }}>
            {product.category}
          </span>
        )}
      </div>

      {/* Price & actions */}
      <div style={{ textAlign: 'right', minWidth: 110 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>
          <span style={{ fontSize: 13, verticalAlign: 'top', fontWeight: 400 }}>$</span>
          {Math.floor(product.price)}
          <span style={{ fontSize: 13, verticalAlign: 'top', fontWeight: 400 }}>
            .{(product.price % 1 * 100).toFixed(0).padStart(2, '0')}
          </span>
        </div>
        {product.is_prime && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 4,
            padding: '2px 8px', background: '#EFF6FF', borderRadius: 4,
            fontSize: 11, fontWeight: 600, color: '#2563EB',
          }}>
            ✓ Prime
          </div>
        )}
        {product.similarity != null && (
          <div style={{ marginTop: 4, fontSize: 11, color: '#A78BFA' }}>
            {(product.similarity * 100).toFixed(1)}% match
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          <button
            style={{
              background: 'linear-gradient(135deg, #FCD34D, #F59E0B)',
              border: 'none', borderRadius: 20, padding: '8px 18px',
              fontSize: 13, fontWeight: 600, color: '#78350F', cursor: 'pointer',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  'I need something to help me sleep better',
  'Gift for someone who loves building things',
  'Best coffee setup for home barista',
  'I work from home and need a better desk setup',
  'Something for long road trips',
  'I want to start running outdoors',
  'Keep my house clean automatically',
  'Premium audio experience at home',
];

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchMode, setSearchMode] = useState('hybrid');
  const [searchTime, setSearchTime] = useState(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const doSearch = useCallback(async (q) => {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;

    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setSearched(true);
    setError(null);
    setSearchTime(null);

    const start = performance.now();

    try {
      const { data } = await axios.post('/search', {
        query: searchQuery,
        limit: 20,
        mode: searchMode,
      }, { signal: controller.signal });

      setSearchTime(Math.round(performance.now() - start));
      setResults(data.results || []);
    } catch (err) {
      if (axios.isCancel(err)) return;
      console.error('Search error:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.query?.[0] ||
        'Search failed. Make sure the Laravel API is running.'
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, searchMode]);

  const handleKey = (e) => {
    if (e.key === 'Enter') doSearch();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFBFF', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        input::placeholder { color: #9CA3AF; }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1E1B4B, #312E81, #4338CA)',
        padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 24 }}>🛒</div>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'white', letterSpacing: -0.5 }}>SmartShop</span>
          <span style={{
            fontSize: 10, fontWeight: 600, background: 'rgba(255,255,255,0.15)',
            color: '#C7D2FE', padding: '2px 8px', borderRadius: 10, marginLeft: 4,
          }}>AI POWERED</span>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <span style={{ color: '#C7D2FE', fontSize: 13, cursor: 'pointer' }}>Orders</span>
          <span style={{ color: '#C7D2FE', fontSize: 13, cursor: 'pointer' }}>Account</span>
          <span style={{ color: 'white', fontSize: 18, cursor: 'pointer' }}>🛒</span>
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 20px' }}>

        {/* Hero / Search */}
        <div style={{
          textAlign: 'center',
          paddingTop: searched ? 30 : 80,
          paddingBottom: searched ? 20 : 40,
          transition: 'padding 0.4s ease',
        }}>
          {!searched && (
            <div style={{ animation: 'fadeSlideIn 0.5s ease' }}>
              <h1 style={{ fontSize: 36, fontWeight: 800, color: '#1E1B4B', margin: 0, letterSpacing: -1 }}>
                What are you looking to buy?
              </h1>
              <p style={{ fontSize: 16, color: '#6B7280', marginTop: 8, marginBottom: 0 }}>
                Describe what you need in your own words — our AI will find the perfect match
              </p>
            </div>
          )}

          {/* Search box */}
          <div
            style={{
              marginTop: searched ? 0 : 32, display: 'flex', alignItems: 'center',
              background: 'white', borderRadius: 16, border: '2px solid #E0E7FF',
              boxShadow: '0 4px 24px rgba(99,102,241,0.1)',
              padding: '4px 4px 4px 20px', maxWidth: 680,
              margin: searched ? '0 auto' : '32px auto 0',
              transition: 'all 0.3s ease',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#818CF8'; e.currentTarget.style.boxShadow = '0 4px 32px rgba(99,102,241,0.2)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#E0E7FF'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(99,102,241,0.1)'; }}
          >
            <span style={{ fontSize: 20, marginRight: 8, opacity: 0.5 }}>🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder='Try "something to keep my drinks cold on hikes" or "best gift for a tech lover"'
              style={{
                flex: 1, border: 'none', outline: 'none', fontSize: 15,
                padding: '14px 0', background: 'transparent', color: '#111827',
              }}
            />
            <button
              onClick={() => doSearch()}
              disabled={loading}
              style={{
                background: loading ? '#A5B4FC' : 'linear-gradient(135deg, #6366F1, #4F46E5)',
                border: 'none', borderRadius: 12, padding: '12px 24px',
                color: 'white', fontSize: 14, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => !loading && (e.target.style.transform = 'scale(1.03)')}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Search mode toggle */}
          {searched && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              {['hybrid', 'semantic'].map(mode => (
                <button
                  key={mode}
                  onClick={() => { setSearchMode(mode); if (query.trim()) setTimeout(() => doSearch(), 0); }}
                  style={{
                    padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                    border: '1px solid', cursor: 'pointer', transition: 'all 0.2s',
                    background: searchMode === mode ? '#EEF2FF' : 'white',
                    borderColor: searchMode === mode ? '#818CF8' : '#E5E7EB',
                    color: searchMode === mode ? '#4338CA' : '#9CA3AF',
                  }}
                >
                  {mode === 'hybrid' ? '🔀 Hybrid' : '🧠 Semantic'}
                </button>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {!searched && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
              marginTop: 20, animation: 'fadeSlideIn 0.5s ease 0.2s both',
            }}>
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(s); doSearch(s); }}
                  style={{
                    background: 'white', border: '1px solid #E5E7EB', borderRadius: 20,
                    padding: '7px 14px', fontSize: 12, color: '#6B7280', cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.target.style.borderColor = '#818CF8'; e.target.style.color = '#4F46E5'; e.target.style.background = '#F0F0FF'; }}
                  onMouseLeave={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.color = '#6B7280'; e.target.style.background = 'white'; }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 10, height: 10, borderRadius: '50%', background: '#6366F1',
                  animation: `pulse 1s ease ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
            <p style={{ color: '#6B7280', fontSize: 14, marginTop: 14 }}>
              Understanding your needs with AI...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12,
            padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <p style={{ margin: 0, fontSize: 13, color: '#991B1B', fontWeight: 600 }}>Search Error</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#B91C1C' }}>{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {searched && !loading && (
          <div style={{ paddingBottom: 60 }}>
            {/* AI insight bar */}
            {results.length > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #EEF2FF, #F0F4FF)',
                borderRadius: 12, padding: '14px 18px', marginBottom: 20,
                display: 'flex', alignItems: 'flex-start', gap: 10,
                border: '1px solid #E0E7FF', animation: 'fadeSlideIn 0.3s ease',
              }}>
                <span style={{ fontSize: 18 }}>✨</span>
                <p style={{ margin: 0, fontSize: 13, color: '#4338CA', lineHeight: 1.5 }}>
                  Found <strong>{results.length}</strong> product{results.length !== 1 ? 's' : ''} matching "<em>{query}</em>"
                  {searchTime && <span style={{ color: '#818CF8' }}> · {searchTime}ms</span>}
                  {results.length > 0 && (
                    <span> · Top picks: {results.slice(0, 3).map(p => p.name).join(', ')}</span>
                  )}
                </p>
              </div>
            )}

            {/* Result count */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#9CA3AF' }}>
                {results.length} result{results.length !== 1 ? 's' : ''} for "
                <span style={{ color: '#4F46E5', fontWeight: 500 }}>{query}</span>"
                <span style={{ marginLeft: 8, color: '#D1D5DB' }}>·</span>
                <span style={{ marginLeft: 8, color: '#A78BFA', fontSize: 11 }}>
                  {searchMode === 'hybrid' ? 'hybrid search' : 'semantic search'}
                </span>
              </p>
            </div>

            {/* Product cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {results.map((p, i) => (
                <ProductCard key={p.id} product={p} idx={i} />
              ))}
            </div>

            {/* Empty state */}
            {results.length === 0 && !error && (
              <div style={{ textAlign: 'center', padding: '60px 0', animation: 'fadeSlideIn 0.3s ease' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <h3 style={{ color: '#374151', fontSize: 18, margin: 0 }}>No matches found</h3>
                <p style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>
                  Try describing what you're looking for in different words
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mount ────────────────────────────────────────────────────
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<App />);
}