/* ===== Transactions page ===== */

const Transactions = {
    _currentType: 'expense',

    render() {
        this.populateFilters();
        this.renderList();
    },

    populateFilters() {
        // Month filter default
        const monthInput = document.getElementById('filter-month');
        if (!monthInput.value) {
            monthInput.value = getCurrentMonth();
        }

        // Category filter
        const catSelect = document.getElementById('filter-category');
        const currentVal = catSelect.value;
        const type = document.getElementById('filter-type').value;

        let categories = [];
        if (type === 'all' || type === 'expense') {
            categories = categories.concat(Store.getCategories('expense'));
        }
        if (type === 'all' || type === 'income') {
            categories = categories.concat(Store.getCategories('income'));
        }
        categories = [...new Set(categories)];

        catSelect.innerHTML = '<option value="all">Все категории</option>' +
            categories.map(c => `<option value="${c}">${c}</option>`).join('');

        if (currentVal && categories.includes(currentVal)) {
            catSelect.value = currentVal;
        }

        // Add event listeners (once)
        if (!this._filtersInit) {
            this._filtersInit = true;
            document.getElementById('filter-type').addEventListener('change', () => this.render());
            document.getElementById('filter-category').addEventListener('change', () => this.renderList());
            document.getElementById('filter-month').addEventListener('change', () => this.renderList());
        }
    },

    renderList() {
        const container = document.getElementById('transactions-list');
        let transactions = Store.getTransactions();

        // Apply filters
        const typeFilter = document.getElementById('filter-type').value;
        const catFilter = document.getElementById('filter-category').value;
        const monthFilter = document.getElementById('filter-month').value;

        if (typeFilter !== 'all') {
            transactions = transactions.filter(t => t.type === typeFilter);
        }
        if (catFilter !== 'all') {
            transactions = transactions.filter(t => t.category === catFilter);
        }
        if (monthFilter) {
            transactions = filterTransactionsByMonth(transactions, monthFilter);
        }

        // Sort by date descending
        transactions.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

        if (transactions.length === 0) {
            container.innerHTML = '<div class="empty-state">Нет операций за этот период</div>';
            return;
        }

        container.innerHTML = transactions.map(t => this.renderItem(t)).join('');
    },

    renderItem(t) {
        const emoji = getCategoryEmoji(t.category);
        const sign = t.type === 'income' ? '+' : '-';
        const amountStr = `${sign}${formatMoney(t.amount, t.currency)}`;

        return `
            <div class="transaction-item">
                <div class="tx-icon ${t.type}">${emoji}</div>
                <div class="tx-info" onclick="Transactions.openEditModal('${t.id}')">
                    <div class="tx-category">${t.category}</div>
                    <div class="tx-description">${t.description || ''}</div>
                </div>
                <div class="tx-right">
                    <div class="tx-amount ${t.type}">${amountStr}</div>
                    <div class="tx-date">${formatDate(t.date)}</div>
                </div>
                <div class="tx-actions">
                    <button class="tx-action-btn" onclick="Transactions.openEditModal('${t.id}')" title="Редактировать">&#9998;</button>
                    <button class="tx-action-btn delete" onclick="Transactions.deleteTransaction('${t.id}')" title="Удалить">&times;</button>
                </div>
            </div>
        `;
    },

    // --- Add/Edit Modal ---

    openAddModal() {
        this._currentType = 'expense';
        document.getElementById('modal-transaction-title').textContent = 'Новая операция';
        document.getElementById('transaction-form').reset();
        document.getElementById('tx-id').value = '';
        document.getElementById('tx-date').value = getTodayDate();
        document.getElementById('tx-currency').value = Store.getSettings().defaultCurrency;

        this.updateTypeToggle('expense');
        this.populateCategorySelect('expense');
        this.initFormEvents();

        App.openModal('modal-transaction');
    },

    openEditModal(id) {
        const tx = Store.getTransactionById(id);
        if (!tx) return;

        document.getElementById('modal-transaction-title').textContent = 'Редактировать';
        document.getElementById('tx-id').value = tx.id;
        document.getElementById('tx-amount').value = tx.amount;
        document.getElementById('tx-currency').value = tx.currency;
        document.getElementById('tx-description').value = tx.description || '';
        document.getElementById('tx-date').value = tx.date;

        this._currentType = tx.type;
        this.updateTypeToggle(tx.type);
        this.populateCategorySelect(tx.type);
        document.getElementById('tx-category').value = tx.category;
        this.initFormEvents();

        App.openModal('modal-transaction');
    },

    updateTypeToggle(type) {
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
    },

    populateCategorySelect(type) {
        const select = document.getElementById('tx-category');
        const categories = Store.getCategories(type);
        select.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
    },

    initFormEvents() {
        if (this._formInit) return;
        this._formInit = true;

        // Type toggle
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._currentType = btn.dataset.type;
                this.updateTypeToggle(btn.dataset.type);
                this.populateCategorySelect(btn.dataset.type);
            });
        });

        // Form submit
        document.getElementById('transaction-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTransaction();
        });
    },

    saveTransaction() {
        const id = document.getElementById('tx-id').value;
        const data = {
            type: this._currentType,
            amount: parseFloat(document.getElementById('tx-amount').value),
            currency: document.getElementById('tx-currency').value,
            category: document.getElementById('tx-category').value,
            description: document.getElementById('tx-description').value.trim(),
            date: document.getElementById('tx-date').value
        };

        if (!data.amount || !data.category || !data.date) return;

        if (id) {
            Store.updateTransaction(id, data);
        } else {
            Store.addTransaction(data);
        }

        App.closeModal('modal-transaction');
        App.refresh();
    },

    async deleteTransaction(id) {
        const confirmed = await App.confirm('Удалить эту операцию?');
        if (confirmed) {
            Store.deleteTransaction(id);
            App.refresh();
        }
    }
};
