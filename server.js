console.log('DEBUG: Server starting...');
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const port = 3000;
const session = require('express-session');

const ENABLE_SESSION_AUTH = process.env.ENABLE_SESSION_AUTH === 'true';
const APP_USERNAME = process.env.APP_USERNAME || 'admin';
const APP_PASSWORD = process.env.APP_PASSWORD || 'password';

if (ENABLE_SESSION_AUTH) {
  app.use(session({
    secret: process.env.SESSION_SECRET || 'change_this_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }));

  // Login page
  app.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('login', { error: null });
  });

  // Login handler
  app.post('/login', express.urlencoded({ extended: true }), (req, res) => {
    const { username, password } = req.body;
    if (username === APP_USERNAME && password === APP_PASSWORD) {
      req.session.user = username;
      return res.redirect('/');
    }
    res.render('login', { error: 'Invalid credentials' });
  });

  // Logout
  app.get('/logout', (req, res) => {
    req.session.destroy(() => {
      res.redirect('/login');
    });
  });

  // Auth middleware for all routes except login/logout/static
  app.use((req, res, next) => {
    if (
      req.path === '/login' ||
      req.path === '/logout' ||
      req.path.startsWith('/public') ||
      req.path.startsWith('/favicon.ico')
    ) {
      return next();
    }
    if (!req.session.user) {
      return res.redirect('/login');
    }
    next();
  });
}

// Global request logger
app.use((req, res, next) => {
    console.log('DEBUG: Request received', req.method, req.url);
    next();
});

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static('public'));

// Helper function to parse size string
function parseSize(sizeStr) {
    if (!sizeStr) return 0;
    const match = sizeStr.match(/(\d+\.?\d*)\s*MB/);
    return match ? parseFloat(match[1]) : 0;
}

// Read catalog data
const catalogPath = path.join(__dirname, '..', 'humble', 'humblebundle-ebook-downloader', 'detailed_catalog.json');
const fanaticalPath = path.join(__dirname, 'fanatical-book-details.json');

// Search function to find bundles containing a book title
async function searchBundlesByBook(searchTerm, humbleBundles, fanaticalBundles) {
    const searchTermLower = searchTerm.toLowerCase();
    const allBundles = [...humbleBundles, ...fanaticalBundles];
    return allBundles
        .filter(bundle => 
            bundle.books && bundle.books.some(book => 
                (book['Book Title'] || book.title || '').toLowerCase().includes(searchTermLower)
            )
        )
        .map(bundle => {
            const matchingBooks = bundle.books.filter(book => 
                (book['Book Title'] || book.title || '').toLowerCase().includes(searchTermLower)
            );
            return {
                id: bundle.machine_name || bundle.id,
                name: bundle.human_name || bundle.name,
                purchaseDate: bundle.purchase_date ? new Date(bundle.purchase_date) : (bundle['purchase date'] ? new Date(bundle['purchase date']) : bundle.purchaseDate),
                numBooks: bundle['Number of books'] || bundle.numBooks,
                downloaded: bundle.downloaded,
                matchingBooks: matchingBooks.map(book => ({
                    title: book['Book Title'] || book.title,
                    formats: book['Available Formats'] ? book['Available Formats'].map(f => f.format) : (book.formats ? Object.keys(book.formats) : [])
                })),
                source: bundle.source || (bundle.machine_name ? 'humble' : 'fanatical')
            };
        });
}

// Helper to normalize Fanatical bundles to Humble-like structure
function normalizeFanaticalBundle(bundle) {
    // Format total_spent to dollars.cents if needed
    let totalSpent = bundle.total_spent || null;
    if (totalSpent && typeof totalSpent === 'string' && !totalSpent.includes('.')) {
        if (/^\d+$/.test(totalSpent)) {
            totalSpent = (parseInt(totalSpent, 10) / 100).toFixed(2);
        }
    } else if (typeof totalSpent === 'number' && !totalSpent.toString().includes('.')) {
        totalSpent = (totalSpent / 100).toFixed(2);
    }
    return {
        id: bundle.slug || bundle._id,
        name: bundle.name,
        cover: bundle.cover || null,
        purchaseDate: null, // Fanatical doesn't have purchase date by default
        numBooks: bundle.books ? bundle.books.length : 0,
        downloaded: bundle.downloaded === true,
        gamekey: null,
        amountSpent: null,
        source: 'fanatical',
        books: (bundle.books || []).map(book => ({
            title: book.name,
            name: book.name,
            authors: null,
            publisher: null,
            description: null,
            isbn: null,
            downloaded: false,
            icon: book.cover,
            formats: (book.files || []).reduce((acc, file) => {
                acc[file.format] = {
                    size: file.size_MB,
                    format: file.format,
                    download_urls: { web: file.api_download }
                };
                return acc;
            }, {})
        })),
        // Pass through these fields for detail page
        purchase_date: bundle.purchase_date || null,
        total_spent: totalSpent,
        _id: bundle._id || null
    };
}

// Routes
app.get('/', async (req, res) => {
    try {
        const catalogData = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
        let bundles = catalogData.bundles.map(bundle => ({
            id: bundle.machine_name,
            name: bundle.human_name,
            purchaseDate: new Date(bundle.purchase_date || bundle['purchase date']),
            numBooks: bundle['Number of books'],
            downloaded: bundle.downloaded,
            gamekey: bundle.gamekey,
            amountSpent: bundle.amount_spent,
            source: 'humble',
            books: (bundle.books || []).map(book => ({
                ...book,
                name: book['Book Title']
            }))
        }));

        // Load and normalize Fanatical bundles
        let fanaticalBundles = [];
        try {
            const fanaticalData = JSON.parse(await fs.readFile(fanaticalPath, 'utf8'));
            fanaticalBundles = (fanaticalData.bundles || []).map(normalizeFanaticalBundle);
        } catch (e) {
            // Ignore if file not found
        }

        // Filtering by source
        const filterSource = req.query.filterSource || 'both';
        let allBundles = [];
        if (filterSource === 'humble') {
            allBundles = bundles;
        } else if (filterSource === 'fanatical') {
            allBundles = fanaticalBundles;
        } else {
            allBundles = [...bundles, ...fanaticalBundles];
        }

        // Filtering by downloaded status
        const filterDownloaded = req.query.filterDownloaded;
        if (filterDownloaded === 'downloaded') {
            allBundles = allBundles.filter(b => b.downloaded);
        } else if (filterDownloaded === 'not-downloaded') {
            allBundles = allBundles.filter(b => !b.downloaded);
        }

        // Count downloaded bundles (humble only)
        const downloadedBundlesCount = catalogData.bundles.filter(b => b.downloaded).length;

        // Sort bundles
        const sort = req.query.sort || 'name';
        const sortDir = req.query.sortDir === 'desc' ? 'desc' : 'asc';
        allBundles.sort((a, b) => {
            let cmp = 0;
            if (sort === 'name') {
                cmp = a.name.localeCompare(b.name);
            } else if (sort === 'date') {
                cmp = (a.purchaseDate || 0) - (b.purchaseDate || 0);
            } else if (sort === 'downloaded') {
                cmp = (a.downloaded === b.downloaded) ? 0 : a.downloaded ? -1 : 1;
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });

        // Handle book search
        let searchResults = null;
        if (req.query.bookSearch) {
            searchResults = await searchBundlesByBook(req.query.bookSearch, bundles, fanaticalBundles);
        }
        
        // Compute stats based on filtered bundles
        let totalBundles, bookBundles;
        if (filterSource === 'humble') {
            totalBundles = catalogData['All Bundles'];
            bookBundles = catalogData['Book Bundles'];
        } else if (filterSource === 'fanatical') {
            totalBundles = fanaticalBundles.length;
            bookBundles = fanaticalBundles.length;
        } else {
            totalBundles = (catalogData['All Bundles'] || 0) + fanaticalBundles.length;
            bookBundles = (catalogData['Book Bundles'] || 0) + fanaticalBundles.length;
        }
        const downloadedBundles = allBundles.filter(b => b.downloaded).length;

        res.render('index', { 
            bundles: allBundles,
            filter: req.query.filter || '',
            sort: sort,
            sortDir: sortDir,
            filterDownloaded: filterDownloaded || 'all',
            filterSource: filterSource,
            stats: {
                totalBundles: totalBundles,
                bookBundles: bookBundles,
                downloadedBundles: downloadedBundles
            },
            bookSearch: req.query.bookSearch || '',
            searchResults
        });
    } catch (error) {
        console.error('Error loading catalog:', error);
        res.status(500).send(`Error loading catalog: ${error.message}`);
    }
});

app.get('/bundle/:id', async (req, res, next) => {
    console.log('DEBUG: /bundle/:id route hit for', req.params.id);
    try {
        console.log('Looking up bundle:', req.params.id);
        const catalogData = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
        let bundle = catalogData.bundles.find(b => b.machine_name === req.params.id);
        let source = 'humble';
        console.log('Humble bundle found:', !!bundle);

        // If not found in Humble, try Fanatical
        if (!bundle) {
            try {
                const fanaticalData = JSON.parse(await fs.readFile(fanaticalPath, 'utf8'));
                const fanBundle = (fanaticalData.bundles || []).find(b => (b.slug || b._id) === req.params.id);
                if (fanBundle) {
                    bundle = normalizeFanaticalBundle(fanBundle);
                    source = 'fanatical';
                }
                console.log('Fanatical bundle found:', !!fanBundle);
            } catch (e) { console.log('Error reading fanatical data:', e); }
        }

        if (!bundle) {
            console.log('Bundle not found for id:', req.params.id);
            return res.status(404).send('Bundle not found');
        }

        // Transform the book data to match our template (for Humble)
        let books;
        let purchaseDate = null;
        let amountSpent = null;
        if (source === 'humble') {
            purchaseDate = bundle.purchase_date ? new Date(bundle.purchase_date) : (bundle['purchase date'] ? new Date(bundle['purchase date']) : null);
            amountSpent = bundle.amount_spent || bundle['amount spent'] || null;
            books = (bundle.books || []).map(book => ({
                title: book['Book Title'],
                name: book['Book Title'],
                authors: book.Authors || book.Author,
                publisher: book.Publisher,
                description: book.Description,
                isbn: book.ISBN,
                downloaded: book.downloaded || false,
                icon: book.icon,
                formats: book['Available Formats'] ? 
                    book['Available Formats'].reduce((acc, format) => {
                        acc[format.format] = {
                            size: parseSize(format.size),
                            format: format.format,
                            download_urls: format.download_urls || {}
                        };
                        return acc;
                    }, {}) : {}
            }));
        } else {
            // Already normalized for Fanatical
            books = bundle.books;
        }
        console.log('Rendering bundle page for:', bundle.name, 'with', books.length, 'books');

        let bundleId = null;
        if (source === 'humble') {
            bundleId = bundle.machine_name || bundle['machine_name'];
        } else {
            bundleId = bundle.id;
        }
        let gamekey = null;
        if (source === 'humble') {
            gamekey = bundle.gamekey;
        } else {
            gamekey = bundle._id;
        }
        if (source === 'fanatical') {
            purchaseDate = bundle.purchase_date ? new Date(bundle.purchase_date) : null;
            amountSpent = bundle.total_spent || null;
        }
        let cover = null;
        if (source === 'fanatical') {
            cover = bundle.cover || null;
        } else if (source === 'humble') {
            cover = bundle.cover || null;
        }
        console.log('DEBUG: About to render bundle', bundle.name, 'source:', source, 'cover:', cover);
        res.render('bundle', { 
            bundle: {
                name: bundle.name,
                id: bundleId,
                purchaseDate: purchaseDate,
                numBooks: bundle.numBooks,
                downloaded: bundle.downloaded,
                gamekey: gamekey,
                amountSpent: amountSpent,
                books: books,
                source: source,
                cover: cover
            }
        });
    } catch (error) {
        console.error('Error loading bundle:', error);
        next(error);
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).send(`<pre>${err.stack || err}</pre>`);
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 