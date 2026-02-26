/* ===== App — router, init, navigation ===== */

const App = {
    currentPage: 'dashboard',

    init() {
        Store.init();
        this.initTheme();
        this.initRouter();
        this.initNavigation();
        this.initModals();

        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(() => {});
        }

        // Navigate to current hash or default
        this.navigate(location.hash.slice(1) || 'dashboard');
    },

    // --- Theme ---

    initTheme() {
        const settings = Store.getSettings();
        this.applyTheme(settings.theme);

        document.getElementById('theme-toggle-btn').addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            this.applyTheme(next);
            Store.updateSettings({ theme: next });
            const themeSelect = document.getElementById('setting-theme');
            if (themeSelect) themeSelect.value = next;
        });
    },

    applyTheme(theme) {
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
        // Update meta theme-color
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        document.querySelector('meta[name="theme-color"]').content = isDark ? '#0d1117' : '#6c5ce7';
    },

    // --- Router ---

    initRouter() {
        window.addEventListener('hashchange', () => {
            this.navigate(location.hash.slice(1));
        });
    },

    navigate(page) {
        if (!page || !document.getElementById(`page-${page}`)) {
            page = 'dashboard';
        }

        // Hide current page
        const activePage = document.querySelector('.page.active');
        if (activePage) activePage.classList.remove('active');

        // Show new page
        const newPage = document.getElementById(`page-${page}`);
        newPage.classList.add('active');

        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        this.currentPage = page;

        // Render page content
        this.renderPage(page);
    },

    renderPage(page) {
        switch (page) {
            case 'dashboard': Dashboard.render(); break;
            case 'transactions': Transactions.render(); break;
            case 'statistics': Statistics.render(); break;
            case 'savings': Savings.render(); break;
            case 'budget': Budget.render(); break;
            case 'settings': Settings.render(); break;
        }
    },

    // --- Navigation ---

    initNavigation() {
        // FAB button
        document.getElementById('fab-add').addEventListener('click', () => {
            Transactions.openAddModal();
        });
    },

    // --- Modals ---

    initModals() {
        // Close modals on overlay click or close button
        document.querySelectorAll('.modal').forEach(modal => {
            const overlay = modal.querySelector('.modal-overlay');
            const closeBtn = modal.querySelector('.modal-close');
            if (overlay) overlay.addEventListener('click', () => this.closeModal(modal.id));
            if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal(modal.id));
        });
    },

    openModal(id) {
        document.getElementById(id).classList.add('open');
        document.body.style.overflow = 'hidden';
    },

    closeModal(id) {
        document.getElementById(id).classList.remove('open');
        document.body.style.overflow = '';
    },

    // --- Confirm dialog ---

    confirm(message, okText = 'Удалить') {
        return new Promise(resolve => {
            document.getElementById('confirm-message').textContent = message;
            document.getElementById('confirm-ok').textContent = okText;
            this.openModal('modal-confirm');

            const okBtn = document.getElementById('confirm-ok');
            const cancelBtn = document.getElementById('confirm-cancel');

            const cleanup = () => {
                okBtn.removeEventListener('click', onOk);
                cancelBtn.removeEventListener('click', onCancel);
                this.closeModal('modal-confirm');
            };

            const onOk = () => { cleanup(); resolve(true); };
            const onCancel = () => { cleanup(); resolve(false); };

            okBtn.addEventListener('click', onOk);
            cancelBtn.addEventListener('click', onCancel);
        });
    },

    // --- Refresh current page ---

    refresh() {
        this.renderPage(this.currentPage);
    }
};

// Start the app
document.addEventListener('DOMContentLoaded', () => App.init());
