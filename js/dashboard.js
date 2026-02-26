/* ===== Dashboard page ===== */

const Dashboard = {
    render() {
        const month = getCurrentMonth();
        const transactions = filterTransactionsByMonth(Store.getTransactions(), month);
        const settings = Store.getSettings();
        const defCurrency = settings.defaultCurrency;

        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(t => {
            const amountRub = convertToRub(t.amount, t.currency);
            if (t.type === 'income') totalIncome += amountRub;
            else totalExpense += amountRub;
        });

        const balance = totalIncome - totalExpense;

        document.getElementById('balance-amount').textContent = formatMoney(balance, 'RUB');
        document.getElementById('income-amount').textContent = formatMoney(totalIncome, 'RUB');
        document.getElementById('expense-amount').textContent = formatMoney(totalExpense, 'RUB');

        // Balance card color
        const balanceCard = document.querySelector('.balance-card');
        if (balance < 0) {
            balanceCard.style.background = 'linear-gradient(135deg, #e17055, #d63031)';
        } else {
            balanceCard.style.background = '';
        }

        // Recent transactions
        this.renderRecent();
    },

    renderRecent() {
        const container = document.getElementById('recent-transactions');
        const allTransactions = Store.getTransactions();
        const recent = allTransactions.slice(0, 5);

        if (recent.length === 0) {
            container.innerHTML = '<div class="empty-state">Нет операций<br><small>Нажмите + чтобы добавить</small></div>';
            return;
        }

        container.innerHTML = recent.map(t => this.renderTransactionItem(t)).join('');
    },

    renderTransactionItem(t) {
        const emoji = getCategoryEmoji(t.category);
        const sign = t.type === 'income' ? '+' : '-';
        const amountStr = `${sign}${formatMoney(t.amount, t.currency)}`;

        return `
            <div class="transaction-item" onclick="Transactions.openEditModal('${t.id}')">
                <div class="tx-icon ${t.type}">${emoji}</div>
                <div class="tx-info">
                    <div class="tx-category">${t.category}</div>
                    <div class="tx-description">${t.description || ''}</div>
                </div>
                <div class="tx-right">
                    <div class="tx-amount ${t.type}">${amountStr}</div>
                    <div class="tx-date">${formatDate(t.date)}</div>
                </div>
            </div>
        `;
    }
};
