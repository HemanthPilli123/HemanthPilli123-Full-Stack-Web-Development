import React, { useState, useEffect, useMemo } from 'react';
import initialItems from './data/items.json';
import categories from './data/categories.json';
import users from './data/users.json';

// Curated sample images to easily click and populate in the report form
const SAMPLE_PHOTOS = [
  { label: 'Laptop', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80' },
  { label: 'Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80' },
  { label: 'Backpack', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80' },
  { label: 'Keys', url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80' },
  { label: 'Water Bottle', url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80' },
  { label: 'ID Card / Wallet', url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80' },
  { label: 'Dorm Hoodie', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80' }
];

export default function App() {
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('campus_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('campus_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Listings State
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('campus_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved items from localStorage', e);
      }
    }
    return initialItems;
  });

  // Save items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('campus_items', JSON.stringify(items));
  }, [items]);

  // Claims State
  const [claims, setClaims] = useState(() => {
    const saved = localStorage.getItem('campus_claims');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved claims', e);
      }
    }
    return [
      {
        id: 'claim-101',
        itemId: 'item-002',
        itemTitle: 'Fjällräven Kånken Classic Backpack (Navy Blue)',
        claimantName: 'Alex Thorne',
        claimantEmail: 'alex.thorne@campus.edu',
        claimantPhone: '(555) 321-7788',
        message: 'This is my bag! Inside the front pouch is a green library card with student ID #884920 and a silver pen.',
        date: '2026-10-16T10:30:00.000Z',
        status: 'Pending Verification'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('campus_claims', JSON.stringify(claims));
  }, [claims]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'Lost', 'Found', 'Resolved'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'title-asc'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // for Details modal
  const [claimTargetItem, setClaimTargetItem] = useState(null); // for Claim modal
  const [isClaimsViewerOpen, setIsClaimsViewerOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // for Delete confirmation

  // Toast Notifications
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Report Form state
  const initialFormState = {
    type: 'Lost',
    name: '',
    categoryId: 'electronics',
    date: new Date().toISOString().split('T')[0],
    location: '',
    description: '',
    details: '',
    imageUrl: '',
    contactName: 'Maya Lin',
    contactEmail: 'maya.lin@campus.edu',
    contactPhone: '(555) 234-8901'
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});

  // Claim Form state
  const [claimFormData, setClaimFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [claimFormErrors, setClaimFormErrors] = useState({});

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, categoryFilter, sortBy]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalLost = items.filter(i => i.type === 'Lost' && i.status !== 'Resolved').length;
    const totalFound = items.filter(i => i.type === 'Found' && i.status !== 'Resolved').length;
    const totalResolved = items.filter(i => i.status === 'Resolved').length;
    const successRate = items.length > 0 ? Math.round((totalResolved / items.length) * 100) : 0;

    return { totalLost, totalFound, totalResolved, successRate };
  }, [items]);

  // Category map for quick lookup
  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach(c => {
      map[c.id] = c;
    });
    return map;
  }, []);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Type & Resolved filter
      if (typeFilter === 'Lost' && (item.type !== 'Lost' || item.status === 'Resolved')) return false;
      if (typeFilter === 'Found' && (item.type !== 'Found' || item.status === 'Resolved')) return false;
      if (typeFilter === 'Resolved' && item.status !== 'Resolved') return false;

      // Category filter
      if (categoryFilter !== 'all' && item.categoryId !== categoryFilter) return false;

      // Search query filter (matches name, description, location, details, contact)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.name?.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        const matchesLoc = item.location?.toLowerCase().includes(query);
        const matchesDetails = item.details?.toLowerCase().includes(query);
        const matchesContact = item.contactName?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesLoc && !matchesDetails && !matchesContact) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
      }
      if (sortBy === 'oldest') {
        return new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt);
      }
      if (sortBy === 'title-asc') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [items, typeFilter, categoryFilter, searchQuery, sortBy]);

  // Paginated items
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Handler: Open Report Modal (optional preset type)
  const openReportModal = (type = 'Lost') => {
    setFormData({
      ...initialFormState,
      type
    });
    setFormErrors({});
    setIsReportModalOpen(true);
  };

  // Handler: Submit Report Form
  const handleReportSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.name.trim()) errors.name = 'Please provide an item title.';
    if (!formData.location.trim()) errors.location = 'Please specify where the item was lost or found.';
    if (!formData.description.trim()) errors.description = 'Please provide a clear description.';
    if (!formData.contactName.trim()) errors.contactName = 'Your name is required.';
    if (!formData.contactEmail.trim() || !formData.contactEmail.includes('@')) {
      errors.contactEmail = 'A valid campus email is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      addToast('Please complete all required fields.', 'error');
      return;
    }

    const newItem = {
      id: `item-${Date.now()}`,
      name: formData.name.trim(),
      type: formData.type,
      categoryId: formData.categoryId,
      description: formData.description.trim(),
      date: formData.date,
      createdAt: new Date().toISOString(),
      location: formData.location.trim(),
      imageUrl: formData.imageUrl.trim() || '',
      userId: `user-guest-${Date.now()}`,
      contactName: formData.contactName.trim(),
      contactEmail: formData.contactEmail.trim(),
      contactPhone: formData.contactPhone.trim(),
      status: 'Active',
      details: formData.details.trim()
    };

    setItems(prev => [newItem, ...prev]);
    setIsReportModalOpen(false);
    addToast(`${newItem.type} item reported successfully!`, 'success');
  };

  // Handler: Toggle Resolved Status
  const toggleItemResolved = (id, e) => {
    if (e) e.stopPropagation();
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === 'Resolved' ? 'Active' : 'Resolved';
        addToast(
          nextStatus === 'Resolved'
            ? `"${item.name}" marked as Resolved & Reunited!`
            : `"${item.name}" reopened as Active!`,
          'info'
        );
        return { ...item, status: nextStatus };
      }
      return item;
    }));

    if (selectedItem && selectedItem.id === id) {
      setSelectedItem(prev => ({
        ...prev,
        status: prev.status === 'Resolved' ? 'Active' : 'Resolved'
      }));
    }
  };

  // Handler: Delete Item
  const handleDeleteItem = () => {
    if (!itemToDelete) return;
    setItems(prev => prev.filter(i => i.id !== itemToDelete.id));
    if (selectedItem && selectedItem.id === itemToDelete.id) {
      setSelectedItem(null);
    }
    addToast(`"${itemToDelete.name}" was removed.`, 'info');
    setItemToDelete(null);
  };

  // Handler: Submit Claim
  const handleClaimSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!claimFormData.name.trim()) errors.name = 'Your name is required.';
    if (!claimFormData.email.trim() || !claimFormData.email.includes('@')) {
      errors.email = 'Valid campus email is required.';
    }
    if (!claimFormData.message.trim()) {
      errors.message = 'Please provide details or proof of ownership.';
    }

    if (Object.keys(errors).length > 0) {
      setClaimFormErrors(errors);
      return;
    }

    const newClaim = {
      id: `claim-${Date.now()}`,
      itemId: claimTargetItem.id,
      itemTitle: claimTargetItem.name,
      claimantName: claimFormData.name.trim(),
      claimantEmail: claimFormData.email.trim(),
      claimantPhone: claimFormData.phone.trim(),
      message: claimFormData.message.trim(),
      date: new Date().toISOString(),
      status: 'Pending Verification'
    };

    setClaims(prev => [newClaim, ...prev]);
    setClaimTargetItem(null);
    setClaimFormData({ name: '', email: '', phone: '', message: '' });
    setClaimFormErrors({});
    addToast('Your claim message was submitted! The reporter will be alerted.', 'success');
  };

  // Reset to initial demo data
  const handleResetDemoData = () => {
    if (window.confirm('Reset all listings and restore initial campus demo data?')) {
      setItems(initialItems);
      localStorage.setItem('campus_items', JSON.stringify(initialItems));
      addToast('Demo listings restored to original campus catalog.', 'info');
    }
  };

  // Helpers for category icons/colors
  const getCategoryColor = (catId) => {
    return categoryMap[catId]?.color || '#2563eb';
  };

  const getCategoryName = (catId) => {
    return categoryMap[catId]?.name || 'General';
  };

  return (
    <div className="app-container">
      {/* 1. Header & Navigation */}
      <header className="site-header">
        <div className="content-wrapper">
          <div className="nav-inner">
            <div className="brand-logo" onClick={() => { setTypeFilter('all'); setCategoryFilter('all'); setSearchQuery(''); }}>
              <div className="logo-badge">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                  <path d="M11 8v6"></path>
                  <path d="M8 11h6"></path>
                </svg>
              </div>
              <div className="brand-text">
                <h1>Campus Lost &amp; Found</h1>
                <div className="brand-subtitle">Student Belongings Portal</div>
              </div>
            </div>

            <nav className="nav-links-desktop">
              <button
                className={`nav-tab-btn ${typeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTypeFilter('all')}
              >
                All Listings
                <span className="nav-tab-badge">{items.length}</span>
              </button>
              <button
                className={`nav-tab-btn ${typeFilter === 'Lost' ? 'active' : ''}`}
                onClick={() => setTypeFilter('Lost')}
              >
                Lost Items
                <span className="nav-tab-badge">{stats.totalLost}</span>
              </button>
              <button
                className={`nav-tab-btn ${typeFilter === 'Found' ? 'active' : ''}`}
                onClick={() => setTypeFilter('Found')}
              >
                Found Items
                <span className="nav-tab-badge">{stats.totalFound}</span>
              </button>
              <button
                className={`nav-tab-btn ${typeFilter === 'Resolved' ? 'active' : ''}`}
                onClick={() => setTypeFilter('Resolved')}
              >
                Reunited
                <span className="nav-tab-badge">{stats.totalResolved}</span>
              </button>
            </nav>

            <div className="nav-actions">
              <button
                className="icon-btn"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                onClick={toggleTheme}
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4"></circle>
                    <path d="M12 2v2"></path>
                    <path d="M12 20v2"></path>
                    <path d="m4.93 4.93 1.41 1.41"></path>
                    <path d="m17.66 17.66 1.41 1.41"></path>
                    <path d="M2 12h2"></path>
                    <path d="M20 12h2"></path>
                    <path d="m6.34 17.66-1.41 1.41"></path>
                    <path d="m19.07 4.93-1.41 1.41"></path>
                  </svg>
                )}
              </button>

              <button
                className="btn-report-primary"
                onClick={() => openReportModal('Lost')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14"></path>
                  <path d="M5 12h14"></path>
                </svg>
                <span>Report Item</span>
              </button>

              <button
                className="icon-btn mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Navigation Menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" x2="20" y1="12" y2="12"></line>
                  <line x1="4" x2="20" y1="6" y2="6"></line>
                  <line x1="4" x2="20" y1="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-nav-panel">
            <div className="mobile-nav-items">
              <button
                className={`nav-tab-btn ${typeFilter === 'all' ? 'active' : ''}`}
                onClick={() => { setTypeFilter('all'); setMobileMenuOpen(false); }}
              >
                All Listings ({items.length})
              </button>
              <button
                className={`nav-tab-btn ${typeFilter === 'Lost' ? 'active' : ''}`}
                onClick={() => { setTypeFilter('Lost'); setMobileMenuOpen(false); }}
              >
                Lost Items ({stats.totalLost})
              </button>
              <button
                className={`nav-tab-btn ${typeFilter === 'Found' ? 'active' : ''}`}
                onClick={() => { setTypeFilter('Found'); setMobileMenuOpen(false); }}
              >
                Found Items ({stats.totalFound})
              </button>
              <button
                className={`nav-tab-btn ${typeFilter === 'Resolved' ? 'active' : ''}`}
                onClick={() => { setTypeFilter('Resolved'); setMobileMenuOpen(false); }}
              >
                Resolved ({stats.totalResolved})
              </button>
              <button
                className="nav-tab-btn"
                onClick={() => { setIsClaimsViewerOpen(true); setMobileMenuOpen(false); }}
              >
                View Claims Desk ({claims.length})
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="content-wrapper">
        {/* 2. Hero Section */}
        <section className="hero-section">
          <div className="hero-glow-1"></div>
          <div className="hero-glow-2"></div>
          <div className="hero-content">
            <div className="hero-pill-badge">
              <span className="pulse-dot"></span>
              <span>Official Campus Community Network • Instant Alerts</span>
            </div>
            <h2 className="hero-title">
              Reuniting Lost Belongings with <span className="hero-gradient-text">Their Campus Owners</span>
            </h2>
            <p className="hero-description">
              Misplaced your laptop, ID card, keys, or backpack on campus? Browse recent reports or submit a lost or found item in under 60 seconds.
            </p>
            <div className="hero-cta-group">
              <button className="btn-cta-lost" onClick={() => openReportModal('Lost')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>I Lost Something</span>
              </button>
              <button className="btn-cta-found" onClick={() => openReportModal('Found')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>I Found Something</span>
              </button>
              <button
                className="btn-cta-ghost"
                onClick={() => {
                  const target = document.getElementById('listings-container');
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>Browse Catalog</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 13l5 5 5-5M7 6l5 5 5-5"/>
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* 3. Dashboard Statistics Cards */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card lost-stat" onClick={() => setTypeFilter('Lost')} style={{ cursor: 'pointer' }}>
              <div className="stat-info">
                <span className="stat-label">Active Lost Items</span>
                <span className="stat-value">{stats.totalLost}</span>
                <span className="stat-subtext">Awaiting owner recovery</span>
              </div>
              <div className="stat-icon-wrapper">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </div>
            </div>

            <div className="stat-card found-stat" onClick={() => setTypeFilter('Found')} style={{ cursor: 'pointer' }}>
              <div className="stat-info">
                <span className="stat-label">Found Belongings</span>
                <span className="stat-value">{stats.totalFound}</span>
                <span className="stat-subtext">Safely reported on campus</span>
              </div>
              <div className="stat-icon-wrapper">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 12 2 2 4-4"></path>
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
              </div>
            </div>

            <div className="stat-card resolved-stat" onClick={() => setTypeFilter('Resolved')} style={{ cursor: 'pointer' }}>
              <div className="stat-info">
                <span className="stat-label">Reunited Items</span>
                <span className="stat-value">{stats.totalResolved}</span>
                <span className="stat-subtext">Successfully returned</span>
              </div>
              <div className="stat-icon-wrapper">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <polyline points="16 11 18 13 22 9"></polyline>
                </svg>
              </div>
            </div>

            <div className="stat-card recent-stat">
              <div className="stat-info">
                <span className="stat-label">Recovery Rate</span>
                <span className="stat-value">{stats.successRate}%</span>
                <span className="stat-subtext">Community resolve efficiency</span>
              </div>
              <div className="stat-icon-wrapper">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                  <polyline points="16 7 22 7 22 13"></polyline>
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Controls: Search, Filters, Category Tabs */}
        <section id="listings-container" className="controls-container">
          <div className="controls-row-top">
            <div className="search-input-wrapper">
              <div className="search-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </div>
              <input
                type="text"
                className="search-input"
                placeholder="Search items, dorms, buildings, tags (e.g. MacBook, Library, Keys)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>

            <div className="type-filter-group">
              <button
                className={`type-filter-btn ${typeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTypeFilter('all')}
              >
                All
              </button>
              <button
                className={`type-filter-btn ${typeFilter === 'Lost' ? 'active lost' : ''}`}
                onClick={() => setTypeFilter('Lost')}
              >
                Lost Only
              </button>
              <button
                className={`type-filter-btn ${typeFilter === 'Found' ? 'active found' : ''}`}
                onClick={() => setTypeFilter('Found')}
              >
                Found Only
              </button>
              <button
                className={`type-filter-btn ${typeFilter === 'Resolved' ? 'active' : ''}`}
                onClick={() => setTypeFilter('Resolved')}
              >
                Resolved
              </button>
            </div>

            <div className="select-group">
              <select
                className="custom-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort listings"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="title-asc">Sort: Item Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Category Horizontal Pills */}
          <div className="category-pills-bar">
            <button
              className={`category-pill ${categoryFilter === 'all' ? 'active' : ''}`}
              onClick={() => setCategoryFilter('all')}
            >
              <span>All Categories</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`category-pill ${categoryFilter === cat.id ? 'active' : ''}`}
                onClick={() => setCategoryFilter(cat.id)}
              >
                <span className="pill-dot" style={{ backgroundColor: cat.color }}></span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Active Filters Summary Bar */}
          {(categoryFilter !== 'all' || typeFilter !== 'all' || searchQuery.trim() !== '') && (
            <div className="active-filters-bar">
              <div className="active-chips-list">
                <span className="active-filter-label">Active Filters:</span>
                {typeFilter !== 'all' && (
                  <span className="filter-tag">
                    Type: {typeFilter}
                    <span className="filter-tag-remove" onClick={() => setTypeFilter('all')}>✕</span>
                  </span>
                )}
                {categoryFilter !== 'all' && (
                  <span className="filter-tag">
                    Category: {getCategoryName(categoryFilter)}
                    <span className="filter-tag-remove" onClick={() => setCategoryFilter('all')}>✕</span>
                  </span>
                )}
                {searchQuery.trim() !== '' && (
                  <span className="filter-tag">
                    Query: "{searchQuery}"
                    <span className="filter-tag-remove" onClick={() => setSearchQuery('')}>✕</span>
                  </span>
                )}
                <button
                  className="btn-reset-filters"
                  onClick={() => {
                    setTypeFilter('all');
                    setCategoryFilter('all');
                    setSearchQuery('');
                  }}
                >
                  Clear all filters
                </button>
              </div>

              <div className="results-count-text">
                Showing {filteredItems.length} matching {filteredItems.length === 1 ? 'item' : 'items'}
              </div>
            </div>
          )}
        </section>

        {/* 5. Listings Section */}
        <section className="listings-section">
          {paginatedItems.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-state-icon">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              </div>
              <h3 className="empty-state-title">No listings match your search</h3>
              <p className="empty-state-text">
                We couldn't find any items matching your selected criteria. Try resetting filters or reporting a new item to alert the campus.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter('all');
                    setCategoryFilter('all');
                  }}
                >
                  Reset All Filters
                </button>
                <button
                  className="btn-primary"
                  onClick={() => openReportModal('Lost')}
                >
                  + Report New Item
                </button>
              </div>
            </div>
          ) : (
            <div className="listings-grid">
              {paginatedItems.map((item) => {
                const isResolved = item.status === 'Resolved';
                return (
                  <article
                    key={item.id}
                    className={`item-card ${isResolved ? 'is-resolved' : ''}`}
                    onClick={() => setSelectedItem(item)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Media Preview Box */}
                    <div className="card-media-wrapper">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="card-img"
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="card-fallback-placeholder"
                        style={{ display: item.imageUrl ? 'none' : 'flex' }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                          <circle cx="9" cy="9" r="2"></circle>
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                        </svg>
                        <span>No Photo Provided</span>
                      </div>

                      {/* Floating Badges */}
                      <div className="card-floating-badges">
                        <span className={`badge-type ${item.type.toLowerCase()}`}>
                          {item.type === 'Lost' ? '● Lost' : '✓ Found'}
                        </span>
                        {isResolved && (
                          <span className="badge-resolved">
                            ✓ Returned
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="card-body">
                      <div className="card-category-row">
                        <span className="card-category-tag" style={{ color: getCategoryColor(item.categoryId) }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: getCategoryColor(item.categoryId), display: 'inline-block' }}></span>
                          {getCategoryName(item.categoryId)}
                        </span>
                        <span className="card-date">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          {item.date || 'Recent'}
                        </span>
                      </div>

                      <h3 className="card-title" title={item.name}>{item.name}</h3>

                      <div className="card-location">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>{item.location}</span>
                      </div>

                      <p className="card-description">{item.description}</p>

                      {item.details && (
                        <div className="card-details-chip">
                          <strong>Note:</strong> {item.details}
                        </div>
                      )}

                      {/* Card Footer Actions */}
                      <div className="card-footer" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn-card-view"
                          onClick={() => setSelectedItem(item)}
                        >
                          View Details
                        </button>

                        <div className="card-quick-actions">
                          <button
                            className="btn-card-icon resolve-btn"
                            title={item.status === 'Resolved' ? 'Reopen listing as Active' : 'Mark as Resolved / Reunited'}
                            onClick={(e) => toggleItemResolved(item.id, e)}
                          >
                            {item.status === 'Resolved' ? (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                                <path d="M21 3v5h-5"></path>
                                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                                <path d="M8 16H3v5"></path>
                              </svg>
                            ) : (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            )}
                          </button>

                          <button
                            className="btn-card-icon delete-btn"
                            title="Delete this listing"
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemToDelete(item);
                            }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* 6. Pagination Bar */}
          {totalPages > 1 && (
            <div className="pagination-wrapper">
              <div className="pagination-info">
                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} items
              </div>
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  aria-label="Previous page"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  className="pagination-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* 7. Footer */}
      <footer className="site-footer">
        <div className="content-wrapper">
          <div className="footer-inner">
            <div className="footer-brand">
              <div className="footer-brand-title">Campus Lost &amp; Found Portal</div>
              <div>Dedicated university belongings recovery and safety service.</div>
            </div>
            <div className="footer-actions">
              <button
                className="btn-claims-demo"
                onClick={() => setIsClaimsViewerOpen(true)}
              >
                Claims Desk ({claims.length})
              </button>
              <button
                className="btn-reset-demo"
                onClick={handleResetDemoData}
              >
                Reset Demo Data
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          MODALS & DIALOGS
          ========================================================================= */}

      {/* A. Report Item Modal */}
      {isReportModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsReportModalOpen(false)}>
          <div className="modal-dialog large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-header-title">Report an Item</h2>
              <button
                className="modal-close-btn"
                onClick={() => setIsReportModalOpen(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
              <div className="modal-body">
                {/* Type Selection */}
                <div className="type-radio-group">
                  <div
                    className={`type-radio-card ${formData.type === 'Lost' ? 'active lost' : ''}`}
                    onClick={() => setFormData({ ...formData, type: 'Lost' })}
                  >
                    <div className="type-radio-icon" style={{ backgroundColor: 'var(--lost-bg)', color: 'var(--lost-color)' }}>
                      !
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>I Lost Something</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Notify campus finders to return it</div>
                    </div>
                  </div>

                  <div
                    className={`type-radio-card ${formData.type === 'Found' ? 'active found' : ''}`}
                    onClick={() => setFormData({ ...formData, type: 'Found' })}
                  >
                    <div className="type-radio-icon" style={{ backgroundColor: 'var(--found-bg)', color: 'var(--found-color)' }}>
                      ✓
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>I Found An Item</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Help return item to its owner</div>
                    </div>
                  </div>
                </div>

                <div className="form-grid">
                  {/* Title */}
                  <div className={`form-group span-full ${formErrors.name ? 'has-error' : ''}`}>
                    <label className="form-label">
                      <span>Item Name / Title <span className="required-star">*</span></span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Sony WH-1000XM4 Noise-Cancelling Headphones"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    {formErrors.name && <div className="form-error-msg">{formErrors.name}</div>}
                  </div>

                  {/* Category */}
                  <div className="form-group">
                    <label className="form-label">
                      <span>Category <span className="required-star">*</span></span>
                    </label>
                    <select
                      className="form-select"
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date */}
                  <div className="form-group">
                    <label className="form-label">
                      <span>Date {formData.type === 'Lost' ? 'Lost' : 'Found'} <span className="required-star">*</span></span>
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>

                  {/* Location */}
                  <div className={`form-group span-full ${formErrors.location ? 'has-error' : ''}`}>
                    <label className="form-label">
                      <span>Campus Location <span className="required-star">*</span></span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Central Library - 2nd Floor Silent Study Pods"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                    {formErrors.location && <div className="form-error-msg">{formErrors.location}</div>}
                  </div>

                  {/* Description */}
                  <div className={`form-group span-full ${formErrors.description ? 'has-error' : ''}`}>
                    <label className="form-label">
                      <span>Detailed Description <span className="required-star">*</span></span>
                    </label>
                    <textarea
                      className="form-textarea"
                      placeholder="Provide color, brand, condition, tags, accessories or exact appearance..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                    {formErrors.description && <div className="form-error-msg">{formErrors.description}</div>}
                  </div>

                  {/* Identifying Secret Details */}
                  <div className="form-group span-full">
                    <label className="form-label">
                      <span>Secret Identifying Details (Optional)</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Keyring has a blue dinosaur, sticker of GitHub on the lid, lock code hint"
                      value={formData.details}
                      onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    />
                    <div className="form-hint">Used to verify ownership when someone claims this item.</div>
                  </div>

                  {/* Image URL & Quick Sample Picker */}
                  <div className="form-group span-full">
                    <label className="form-label">
                      <span>Photo Image URL (Optional)</span>
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="Paste image URL (https://...)"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    />
                    <div className="sample-photos-row">
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', alignSelf: 'center' }}>Quick photo:</span>
                      {SAMPLE_PHOTOS.map(sample => (
                        <button
                          key={sample.label}
                          type="button"
                          className="sample-photo-pill"
                          onClick={() => setFormData({ ...formData, imageUrl: sample.url })}
                        >
                          {sample.label}
                        </button>
                      ))}
                    </div>

                    {formData.imageUrl && (
                      <div className="image-preview-box">
                        <img
                          src={formData.imageUrl}
                          alt="Preview"
                          className="preview-thumb"
                          onError={(e) => { e.target.style.opacity = '0.3'; }}
                        />
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          <strong>Photo Preview:</strong> Image loaded successfully.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reporter Contact Info */}
                  <div className={`form-group ${formErrors.contactName ? 'has-error' : ''}`}>
                    <label className="form-label">
                      <span>Your Name <span className="required-star">*</span></span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Maya Lin"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    />
                    {formErrors.contactName && <div className="form-error-msg">{formErrors.contactName}</div>}
                  </div>

                  <div className={`form-group ${formErrors.contactEmail ? 'has-error' : ''}`}>
                    <label className="form-label">
                      <span>University Email <span className="required-star">*</span></span>
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="student@campus.edu"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    />
                    {formErrors.contactEmail && <div className="form-error-msg">{formErrors.contactEmail}</div>}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsReportModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. Item Details Modal */}
      {selectedItem && (
        <div className="modal-backdrop" onClick={() => setSelectedItem(null)}>
          <div className="modal-dialog large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`badge-type ${selectedItem.type.toLowerCase()}`}>
                  {selectedItem.type}
                </span>
                {selectedItem.status === 'Resolved' && (
                  <span className="badge-resolved">✓ Returned to Owner</span>
                )}
                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  ID: #{selectedItem.id}
                </span>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedItem(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="details-layout">
                {/* Media column */}
                <div className="details-media-col">
                  <div className="details-img-container">
                    {selectedItem.imageUrl ? (
                      <img
                        src={selectedItem.imageUrl}
                        alt={selectedItem.name}
                        className="details-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="card-fallback-placeholder"
                      style={{ display: selectedItem.imageUrl ? 'none' : 'flex' }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                        <circle cx="9" cy="9" r="2"></circle>
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                      </svg>
                      <span>No Photo Provided</span>
                    </div>
                  </div>

                  <button
                    className={`btn-resolve-toggle ${selectedItem.status === 'Resolved' ? 'mark-reopen' : 'mark-resolved'}`}
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => toggleItemResolved(selectedItem.id)}
                  >
                    {selectedItem.status === 'Resolved' ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                          <path d="M21 3v5h-5"></path>
                        </svg>
                        <span>Reopen Listing as Active</span>
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>Mark as Resolved &amp; Returned</span>
                      </>
                    )}
                  </button>

                  <button
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => {
                      setClaimTargetItem(selectedItem);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    <span>Contact Reporter / Claim Item</span>
                  </button>
                </div>

                {/* Info column */}
                <div className="details-info-col">
                  <div className="details-header-row">
                    <span className="card-category-tag" style={{ color: getCategoryColor(selectedItem.categoryId) }}>
                      ● {getCategoryName(selectedItem.categoryId)}
                    </span>
                  </div>

                  <h3 className="details-title">{selectedItem.name}</h3>

                  <div className="details-meta-list">
                    <div className="meta-item">
                      <strong>Location:</strong>
                      <span>{selectedItem.location}</span>
                    </div>
                    <div className="meta-item">
                      <strong>Date Reported:</strong>
                      <span>{selectedItem.date || 'Recent'}</span>
                    </div>
                    <div className="meta-item">
                      <strong>Current Status:</strong>
                      <span>{selectedItem.status || 'Active'}</span>
                    </div>
                  </div>

                  <div className="details-desc-box">
                    <h4>Item Description</h4>
                    <p className="details-desc-text">{selectedItem.description}</p>
                  </div>

                  {selectedItem.details && (
                    <div className="identifying-details-callout">
                      <strong>Unique Identifier / Note:</strong> {selectedItem.details}
                    </div>
                  )}

                  <div className="contact-card-box">
                    <div className="contact-card-header">Listing Reported By</div>
                    <div className="contact-person-name">{selectedItem.contactName || 'Campus Student'}</div>
                    <div className="contact-person-email">{selectedItem.contactEmail || 'No email provided'}</div>
                    {selectedItem.contactPhone && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Phone: {selectedItem.contactPhone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-danger"
                onClick={() => {
                  setItemToDelete(selectedItem);
                }}
              >
                Delete Listing
              </button>
              <button className="btn-secondary" onClick={() => setSelectedItem(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C. Claim / Contact Reporter Modal */}
      {claimTargetItem && (
        <div className="modal-backdrop" onClick={() => setClaimTargetItem(null)}>
          <div className="modal-dialog small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-header-title">Claim / Contact Reporter</h2>
              <button
                className="modal-close-btn"
                onClick={() => setClaimTargetItem(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleClaimSubmit}>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Item being claimed:</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{claimTargetItem.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Reporter: {claimTargetItem.contactName} ({claimTargetItem.contactEmail})</div>
                </div>

                <div className="form-grid single-col">
                  <div className={`form-group ${claimFormErrors.name ? 'has-error' : ''}`}>
                    <label className="form-label">
                      <span>Your Full Name <span className="required-star">*</span></span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Jordan Smith"
                      value={claimFormData.name}
                      onChange={(e) => setClaimFormData({ ...claimFormData, name: e.target.value })}
                    />
                    {claimFormErrors.name && <div className="form-error-msg">{claimFormErrors.name}</div>}
                  </div>

                  <div className={`form-group ${claimFormErrors.email ? 'has-error' : ''}`}>
                    <label className="form-label">
                      <span>Your Campus Email <span className="required-star">*</span></span>
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="jsmith@campus.edu"
                      value={claimFormData.email}
                      onChange={(e) => setClaimFormData({ ...claimFormData, email: e.target.value })}
                    />
                    {claimFormErrors.email && <div className="form-error-msg">{claimFormErrors.email}</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <span>Phone Number (Optional)</span>
                    </label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="(555) 000-0000"
                      value={claimFormData.phone}
                      onChange={(e) => setClaimFormData({ ...claimFormData, phone: e.target.value })}
                    />
                  </div>

                  <div className={`form-group ${claimFormErrors.message ? 'has-error' : ''}`}>
                    <label className="form-label">
                      <span>Message / Proof of Ownership <span className="required-star">*</span></span>
                    </label>
                    <textarea
                      className="form-textarea"
                      placeholder="Describe unique marks, serial number, wallpaper, or when you can meet on campus..."
                      value={claimFormData.message}
                      onChange={(e) => setClaimFormData({ ...claimFormData, message: e.target.value })}
                    />
                    {claimFormErrors.message && <div className="form-error-msg">{claimFormErrors.message}</div>}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setClaimTargetItem(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Send Claim Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* D. Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="modal-backdrop" onClick={() => setItemToDelete(null)}>
          <div className="modal-dialog small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-header-title">Delete Listing?</h2>
              <button
                className="modal-close-btn"
                onClick={() => setItemToDelete(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                Are you sure you want to permanently remove <strong>"{itemToDelete.name}"</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setItemToDelete(null)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDeleteItem}>
                Yes, Delete Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* E. Claims Viewer Desk Modal */}
      {isClaimsViewerOpen && (
        <div className="modal-backdrop" onClick={() => setIsClaimsViewerOpen(false)}>
          <div className="modal-dialog large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-header-title">Claims &amp; Inquiries Desk ({claims.length})</h2>
              <button
                className="modal-close-btn"
                onClick={() => setIsClaimsViewerOpen(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {claims.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                  No claims or inquiries received yet.
                </div>
              ) : (
                <div className="claims-list">
                  {claims.map((claim) => (
                    <div key={claim.id} className="claim-item-card">
                      <div className="claim-header">
                        <div>
                          <div className="claim-title">{claim.itemTitle}</div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Claimant: <strong>{claim.claimantName}</strong> ({claim.claimantEmail}) {claim.claimantPhone ? `• ${claim.claimantPhone}` : ''}
                          </div>
                        </div>
                        <div className="claim-date">
                          {new Date(claim.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="claim-msg-box">
                        <strong>Claim Details / Message:</strong> {claim.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsClaimsViewerOpen(false)}>
                Close Desk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Toast Notifications Container */}
      <div className="toast-container" aria-live="polite">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast-item ${toast.type}`}>
            <div className="toast-content">
              {toast.type === 'success' && <span>✓</span>}
              {toast.type === 'error' && <span>✕</span>}
              {toast.type === 'info' && <span>ℹ</span>}
              <span>{toast.message}</span>
            </div>
            <button
              className="toast-close-btn"
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
