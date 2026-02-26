/* ===== Store — localStorage CRUD + export/import ===== */

const STORAGE_KEY = 'finance_data';

const DEFAULT_DATA = {
    transactions: [],
    categories: {
        expense: ['Еда', 'Транспорт', 'Жильё', 'Развлечения', 'Одежда', 'Здоровье', 'Подписки', 'Другое'],
        income: ['Зарплата', 'Подработка', 'Инвестиции', 'Другое']
    },
    savings: [],
    budgets: {},
    settings: {
        theme: 'auto',
        defaultCurrency: 'BYN',
        exchangeRates: { USD: 3.27, EUR: 3.55, RUB: 0.035 }
    }
};

const Store = {
    _data: null,

    init() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                this._data = JSON.parse(saved);
                // Ensure all keys exist (migration safety)
                for (const key of Object.keys(DEFAULT_DATA)) {
                    if (!(key in this._data)) {
                        this._data[key] = JSON.parse(JSON.stringify(DEFAULT_DATA[key]));
                    }
                }
            } catch {
                this._data = JSON.parse(JSON.stringify(DEFAULT_DATA));
            }
        } else {
            this._data = JSON.parse(JSON.stringify(DEFAULT_DATA));
        }
        this._save();
    },

    _save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
    },

    // --- Transactions ---

    getTransactions() {
        return this._data.transactions;
    },

    addTransaction(tx) {
        tx.id = tx.id || generateId();
        this._data.transactions.unshift(tx);
        this._save();
        return tx;
    },

    updateTransaction(id, updates) {
        const idx = this._data.transactions.findIndex(t => t.id === id);
        if (idx !== -1) {
            Object.assign(this._data.transactions[idx], updates);
            this._save();
        }
    },

    deleteTransaction(id) {
        this._data.transactions = this._data.transactions.filter(t => t.id !== id);
        this._save();
    },

    getTransactionById(id) {
        return this._data.transactions.find(t => t.id === id);
    },

    // --- Categories ---

    getCategories(type) {
        return this._data.categories[type] || [];
    },

    addCategory(type, name) {
        if (!this._data.categories[type].includes(name)) {
            this._data.categories[type].push(name);
            this._save();
        }
    },

    removeCategory(type, name) {
        this._data.categories[type] = this._data.categories[type].filter(c => c !== name);
        this._save();
    },

    // --- Budgets ---

    getBudgets() {
        return this._data.budgets;
    },

    setBudget(category, limit, currency) {
        this._data.budgets[category] = { limit, currency };
        this._save();
    },

    removeBudget(category) {
        delete this._data.budgets[category];
        this._save();
    },

    // --- Savings ---

    getSavings() {
        return this._data.savings || [];
    },

    addSaving(s) {
        if (!this._data.savings) this._data.savings = [];
        this._data.savings.unshift(s);
        this._save();
    },

    deleteSaving(id) {
        this._data.savings = (this._data.savings || []).filter(s => s.id !== id);
        this._save();
    },

    // --- Settings ---

    getSettings() {
        return this._data.settings;
    },

    updateSettings(updates) {
        Object.assign(this._data.settings, updates);
        this._save();
    },

    // --- Export / Import ---

    exportData() {
        const blob = new Blob([JSON.stringify(this._data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finance-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.transactions && data.categories && data.settings) {
                this._data = data;
                this._save();
                return true;
            }
            return false;
        } catch {
            return false;
        }
    },

    // --- Reset ---

    resetAll() {
        this._data = JSON.parse(JSON.stringify(DEFAULT_DATA));
        this._save();
    }
};
