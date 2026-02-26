/* ===== Dashboard page ===== */

const Dashboard = {
    render() {
        const allTransactions = Store.getTransactions();

        // --- Overall balance (all time) ---
        let overallBalance = 0;
        allTransactions.forEach(t => {
            const amountByn = convertToByn(t.amount, t.currency);
            if (t.type === 'income') {
                overallBalance += amountByn;
            } else {
                overallBalance -= amountByn;
            }
        });

        document.getElementById('balance-amount').textContent = formatMoney(overallBalance, 'BYN');

        // Balance card color
        const balanceCard = document.querySelector('.balance-card');
        if (overallBalance < 0) {
            balanceCard.style.background = 'linear-gradient(135deg, #e17055, #d63031)';
        } else {
            balanceCard.style.background = '';
        }

        // --- This month stats ---
        const month = getCurrentMonth();
        const monthTx = filterTransactionsByMonth(allTransactions, month);

        let monthIncome = 0;
        let monthExpense = 0;
        let monthSaved = 0;

        monthTx.forEach(t => {
            const amountByn = convertToByn(t.amount, t.currency);
            if (t.type === 'income') {
                monthIncome += amountByn;
            } else if (t.category === 'Сбережение') {
                monthSaved += amountByn;
            } else {
                monthExpense += amountByn;
            }
        });

        // Month label
        const d = new Date(month + '-01T00:00:00');
        const monthName = d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
        document.getElementById('month-label').textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);

        document.getElementById('income-amount').textContent = formatMoney(monthIncome, 'BYN');
        document.getElementById('expense-amount').textContent = formatMoney(monthExpense, 'BYN');

        // Savings summary
        const savingsCard = document.getElementById('savings-summary-card');
        if (monthSaved > 0) {
            savingsCard.style.display = '';
            document.getElementById('savings-month-amount').textContent = formatMoney(monthSaved, 'BYN');
        } else {
            savingsCard.style.display = 'none';
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
