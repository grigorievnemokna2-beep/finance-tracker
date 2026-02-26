/* ===== Statistics page — Chart.js integration ===== */

const Statistics = {
    _categoryChart: null,
    _monthlyChart: null,
    _currentPeriod: 'month',

    render() {
        this.initPeriodTabs();
        this.renderCharts();
        this.renderSummary();
    },

    initPeriodTabs() {
        if (this._tabsInit) return;
        this._tabsInit = true;

        document.querySelectorAll('.period-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.period-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this._currentPeriod = tab.dataset.period;
                this.renderCharts();
                this.renderSummary();
            });
        });
    },

    getFilteredTransactions() {
        return filterTransactionsByPeriod(Store.getTransactions(), this._currentPeriod);
    },

    renderCharts() {
        this.renderCategoryChart();
        this.renderMonthlyChart();
    },

    renderCategoryChart() {
        const transactions = this.getFilteredTransactions().filter(t => t.type === 'expense');

        // Group by category
        const grouped = {};
        transactions.forEach(t => {
            const amount = convertToByn(t.amount, t.currency);
            grouped[t.category] = (grouped[t.category] || 0) + amount;
        });

        const labels = Object.keys(grouped);
        const data = Object.values(grouped);
        const colors = labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

        // Destroy previous chart
        if (this._categoryChart) {
            this._categoryChart.destroy();
        }

        const ctx = document.getElementById('chart-categories').getContext('2d');

        if (labels.length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            document.getElementById('chart-categories-legend').innerHTML =
                '<div class="empty-state" style="padding:20px">Нет данных за период</div>';
            return;
        }

        this._categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '65%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = ((ctx.parsed / total) * 100).toFixed(1);
                                return `${ctx.label}: ${formatMoney(ctx.parsed, 'BYN')} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });

        // Custom legend
        const total = data.reduce((a, b) => a + b, 0);
        document.getElementById('chart-categories-legend').innerHTML = labels.map((label, i) => {
            const pct = ((data[i] / total) * 100).toFixed(0);
            return `
                <div class="legend-item">
                    <span class="legend-dot" style="background:${colors[i]}"></span>
                    <span>${label} ${pct}%</span>
                </div>
            `;
        }).join('');
    },

    renderMonthlyChart() {
        const allTransactions = Store.getTransactions();
        const now = new Date();
        let monthsCount;

        if (this._currentPeriod === 'month') monthsCount = 1;
        else if (this._currentPeriod === 'quarter') monthsCount = 3;
        else monthsCount = 12;

        const months = [];
        const incomeData = [];
        const expenseData = [];

        for (let i = monthsCount - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('ru-RU', { month: 'short' });
            months.push(label);

            const filtered = filterTransactionsByMonth(allTransactions, monthStr);
            let inc = 0, exp = 0;
            filtered.forEach(t => {
                const amt = convertToByn(t.amount, t.currency);
                if (t.type === 'income') inc += amt;
                else exp += amt;
            });
            incomeData.push(inc);
            expenseData.push(exp);
        }

        if (this._monthlyChart) {
            this._monthlyChart.destroy();
        }

        const ctx = document.getElementById('chart-monthly').getContext('2d');
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
        const textColor = isDark ? '#8b949e' : '#636e72';

        this._monthlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Доходы',
                        data: incomeData,
                        backgroundColor: 'rgba(0, 184, 148, 0.7)',
                        borderRadius: 6,
                        barPercentage: 0.6
                    },
                    {
                        label: 'Расходы',
                        data: expenseData,
                        backgroundColor: 'rgba(225, 112, 85, 0.7)',
                        borderRadius: 6,
                        barPercentage: 0.6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor, padding: 16, usePointStyle: true, pointStyle: 'circle' }
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ${formatMoney(ctx.parsed.y, 'BYN')}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: {
                            color: textColor,
                            callback: (v) => {
                                if (v >= 1000) return (v / 1000).toFixed(0) + 'k';
                                return v;
                            }
                        }
                    }
                }
            }
        });
    },

    renderSummary() {
        const transactions = this.getFilteredTransactions();
        let totalIncome = 0, totalExpense = 0;
        let txCount = transactions.length;

        transactions.forEach(t => {
            const amt = convertToByn(t.amount, t.currency);
            if (t.type === 'income') totalIncome += amt;
            else totalExpense += amt;
        });

        const avgExpense = txCount > 0
            ? totalExpense / transactions.filter(t => t.type === 'expense').length || 0
            : 0;

        const container = document.getElementById('stats-summary');
        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-label">Всего доходов</div>
                <div class="stat-value" style="color:var(--income-color)">${formatMoney(totalIncome, 'BYN')}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Всего расходов</div>
                <div class="stat-value" style="color:var(--expense-color)">${formatMoney(totalExpense, 'BYN')}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Операций</div>
                <div class="stat-value">${txCount}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Ср. расход</div>
                <div class="stat-value">${formatMoney(avgExpense, 'BYN')}</div>
            </div>
        `;
    }
};
