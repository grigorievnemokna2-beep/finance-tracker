/* ===== Budget page ===== */

const Budget = {
    render() {
        this.renderList();
        this.initEvents();
    },

    renderList() {
        const container = document.getElementById('budget-list');
        const budgets = Store.getBudgets();
        const categories = Object.keys(budgets);

        if (categories.length === 0) {
            container.innerHTML = '<div class="empty-state">Нет установленных лимитов<br><small>Нажмите + чтобы добавить</small></div>';
            return;
        }

        const month = getCurrentMonth();
        const transactions = filterTransactionsByMonth(Store.getTransactions(), month)
            .filter(t => t.type === 'expense');

        container.innerHTML = categories.map(cat => {
            const budget = budgets[cat];
            const spent = transactions
                .filter(t => t.category === cat)
                .reduce((sum, t) => sum + convertToByn(t.amount, t.currency), 0);

            const limitRub = convertToByn(budget.limit, budget.currency);
            const pct = limitRub > 0 ? Math.min((spent / limitRub) * 100, 100) : 0;
            const colorClass = pct < 70 ? 'green' : pct < 90 ? 'yellow' : 'red';

            return `
                <div class="budget-item">
                    <div class="budget-item-header">
                        <span class="budget-category">${getCategoryEmoji(cat)} ${cat}</span>
                        <span class="budget-amounts">${formatMoney(spent, 'BYN')} / ${formatMoney(budget.limit, budget.currency)}</span>
                    </div>
                    <div class="budget-bar">
                        <div class="budget-bar-fill ${colorClass}" style="width:${pct}%"></div>
                    </div>
                    <div class="budget-item-actions">
                        <button class="budget-action-btn" onclick="Budget.openEditModal('${cat}')">Изменить</button>
                        <button class="budget-action-btn delete" onclick="Budget.deleteBudget('${cat}')">Удалить</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    initEvents() {
        if (this._eventsInit) return;
        this._eventsInit = true;

        document.getElementById('add-budget-btn').addEventListener('click', () => {
            this.openAddModal();
        });

        document.getElementById('budget-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBudget();
        });
    },

    openAddModal() {
        document.getElementById('modal-budget-title').textContent = 'Новый лимит';
        document.getElementById('budget-form').reset();
        document.getElementById('budget-currency').value = Store.getSettings().defaultCurrency;
        this.populateBudgetCategories();
        App.openModal('modal-budget');
    },

    openEditModal(category) {
        const budgets = Store.getBudgets();
        const budget = budgets[category];
        if (!budget) return;

        document.getElementById('modal-budget-title').textContent = 'Изменить лимит';
        this.populateBudgetCategories();
        document.getElementById('budget-category').value = category;
        document.getElementById('budget-limit').value = budget.limit;
        document.getElementById('budget-currency').value = budget.currency;
        App.openModal('modal-budget');
    },

    populateBudgetCategories() {
        const select = document.getElementById('budget-category');
        const categories = Store.getCategories('expense');
        select.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
    },

    saveBudget() {
        const category = document.getElementById('budget-category').value;
        const limit = parseFloat(document.getElementById('budget-limit').value);
        const currency = document.getElementById('budget-currency').value;

        if (!category || !limit || limit <= 0) return;

        Store.setBudget(category, limit, currency);
        App.closeModal('modal-budget');
        App.refresh();
    },

    async deleteBudget(category) {
        const confirmed = await App.confirm(`Удалить лимит для "${category}"?`);
        if (confirmed) {
            Store.removeBudget(category);
            App.refresh();
        }
    }
};
