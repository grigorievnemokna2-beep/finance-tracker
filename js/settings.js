/* ===== Settings page ===== */

const Settings = {
    render() {
        this.renderTheme();
        this.renderCurrency();
        this.renderCategories();
        this.initEvents();
    },

    renderTheme() {
        const settings = Store.getSettings();
        document.getElementById('setting-theme').value = settings.theme;
    },

    renderCurrency() {
        const settings = Store.getSettings();
        document.getElementById('setting-currency').value = settings.defaultCurrency;
        document.getElementById('rate-usd').value = settings.exchangeRates.USD;
        document.getElementById('rate-eur').value = settings.exchangeRates.EUR;
    },

    renderCategories() {
        this.renderCategoryList('expense', 'expense-categories-list');
        this.renderCategoryList('income', 'income-categories-list');
    },

    renderCategoryList(type, containerId) {
        const container = document.getElementById(containerId);
        const categories = Store.getCategories(type);

        container.innerHTML = categories.map(cat => `
            <div class="category-tag">
                <span>${getCategoryEmoji(cat)} ${cat}</span>
                <button class="remove-cat" onclick="Settings.removeCategory('${type}', '${cat}')" title="Удалить">&times;</button>
            </div>
        `).join('');
    },

    initEvents() {
        if (this._eventsInit) return;
        this._eventsInit = true;

        // Theme change
        document.getElementById('setting-theme').addEventListener('change', (e) => {
            const theme = e.target.value;
            Store.updateSettings({ theme });
            App.applyTheme(theme);
        });

        // Currency change
        document.getElementById('setting-currency').addEventListener('change', (e) => {
            Store.updateSettings({ defaultCurrency: e.target.value });
        });

        // Exchange rates
        document.getElementById('rate-usd').addEventListener('change', (e) => {
            const rates = Store.getSettings().exchangeRates;
            rates.USD = parseFloat(e.target.value) || 92;
            Store.updateSettings({ exchangeRates: rates });
        });

        document.getElementById('rate-eur').addEventListener('change', (e) => {
            const rates = Store.getSettings().exchangeRates;
            rates.EUR = parseFloat(e.target.value) || 100;
            Store.updateSettings({ exchangeRates: rates });
        });

        // Add expense category
        document.getElementById('add-expense-cat-btn').addEventListener('click', () => {
            const input = document.getElementById('new-expense-category');
            const name = input.value.trim();
            if (name) {
                Store.addCategory('expense', name);
                input.value = '';
                this.renderCategories();
            }
        });

        // Add income category
        document.getElementById('add-income-cat-btn').addEventListener('click', () => {
            const input = document.getElementById('new-income-category');
            const name = input.value.trim();
            if (name) {
                Store.addCategory('income', name);
                input.value = '';
                this.renderCategories();
            }
        });

        // Enter key for category inputs
        document.getElementById('new-expense-category').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('add-expense-cat-btn').click();
            }
        });

        document.getElementById('new-income-category').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('add-income-cat-btn').click();
            }
        });

        // Export
        document.getElementById('export-btn').addEventListener('click', () => {
            Store.exportData();
        });

        // Import
        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (evt) => {
                const success = Store.importData(evt.target.result);
                if (success) {
                    alert('Данные успешно импортированы!');
                    App.refresh();
                } else {
                    alert('Ошибка: неверный формат файла');
                }
                e.target.value = '';
            };
            reader.readAsText(file);
        });

        // Reset
        document.getElementById('reset-btn').addEventListener('click', async () => {
            const confirmed = await App.confirm('Все данные будут удалены. Продолжить?', 'Сбросить');
            if (confirmed) {
                Store.resetAll();
                App.refresh();
            }
        });
    },

    async removeCategory(type, name) {
        // Check if category is used in transactions
        const used = Store.getTransactions().some(t => t.category === name);
        if (used) {
            const confirmed = await App.confirm(
                `Категория "${name}" используется в операциях. Удалить всё равно?`
            );
            if (!confirmed) return;
        }
        Store.removeCategory(type, name);
        this.renderCategories();
    }
};
