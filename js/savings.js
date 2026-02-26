/* ===== Savings page ===== */

const Savings = {
    _savingType: 'deposit',

    render() {
        this.renderTotal();
        this.renderConverter();
        this.renderList();
        this.initEvents();
    },

    renderTotal() {
        const savings = Store.getSavings();
        let totalUsd = 0;
        savings.forEach(s => {
            if (s.type === 'deposit') totalUsd += s.amount;
            else totalUsd -= s.amount;
        });

        const rates = Store.getSettings().exchangeRates;
        const usdToByn = rates.USD || 3.27;
        const totalByn = totalUsd * usdToByn;

        document.getElementById('savings-total-usd').textContent = `$${formatNumber(totalUsd)}`;
        document.getElementById('savings-total-byn').textContent = `\u2248 ${formatNumber(totalByn)} Br`;
    },

    renderConverter() {
        this.updateConversion();
    },

    updateConversion() {
        const amount = parseFloat(document.getElementById('conv-amount').value) || 0;
        const from = document.getElementById('conv-from').value;
        const to = document.getElementById('conv-to').value;

        const result = this.convert(amount, from, to);
        const sym = CURRENCY_SYMBOLS[to] || to;
        document.getElementById('conv-result').textContent = `${formatNumber(result)} ${sym}`;

        // Show rate info
        if (from !== to) {
            const rate1 = this.convert(1, from, to);
            const symFrom = CURRENCY_SYMBOLS[from] || from;
            document.getElementById('conv-rate-info').textContent =
                `1 ${symFrom} = ${formatNumber(rate1)} ${sym}`;
        } else {
            document.getElementById('conv-rate-info').textContent = '';
        }
    },

    convert(amount, from, to) {
        if (from === to) return amount;
        const rates = Store.getSettings().exchangeRates;

        // Convert to BYN first, then to target
        let byn;
        if (from === 'BYN') {
            byn = amount;
        } else {
            byn = amount * (rates[from] || 1);
        }

        if (to === 'BYN') return byn;
        return byn / (rates[to] || 1);
    },

    renderList() {
        const container = document.getElementById('savings-list');
        const savings = Store.getSavings();

        if (savings.length === 0) {
            container.innerHTML = '<div class="empty-state">Нет записей<br><small>Нажмите + чтобы пополнить копилку</small></div>';
            return;
        }

        container.innerHTML = savings.map(s => {
            const sign = s.type === 'deposit' ? '+' : '-';
            const cls = s.type === 'deposit' ? 'income' : 'expense';
            const icon = s.type === 'deposit' ? '\uD83D\uDCB5' : '\uD83D\uDCB8';
            return `
                <div class="transaction-item">
                    <div class="tx-icon ${cls}">${icon}</div>
                    <div class="tx-info">
                        <div class="tx-category">${s.type === 'deposit' ? 'Пополнение' : 'Снятие'}</div>
                        <div class="tx-description">${s.note || ''}</div>
                    </div>
                    <div class="tx-right">
                        <div class="tx-amount ${cls}">${sign}$${formatNumber(s.amount)}</div>
                        <div class="tx-date">${formatDate(s.date)}</div>
                    </div>
                    <div class="tx-actions">
                        <button class="tx-action-btn delete" onclick="Savings.deleteSaving('${s.id}')" title="Удалить">&times;</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    initEvents() {
        if (this._eventsInit) return;
        this._eventsInit = true;

        // Open add modal
        document.getElementById('add-saving-btn').addEventListener('click', () => {
            this._savingType = 'deposit';
            document.getElementById('saving-form').reset();
            document.getElementById('saving-date').value = getTodayDate();
            this.updateSavingTypeToggle('deposit');
            App.openModal('modal-saving');
        });

        // Type toggle
        document.querySelectorAll('.saving-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._savingType = btn.dataset.type;
                this.updateSavingTypeToggle(btn.dataset.type);
            });
        });

        // Form submit
        document.getElementById('saving-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('saving-amount').value);
            const note = document.getElementById('saving-note').value.trim();
            const date = document.getElementById('saving-date').value;
            if (!amount || !date) return;

            Store.addSaving({
                id: generateId(),
                type: this._savingType,
                amount,
                note,
                date
            });
            App.closeModal('modal-saving');
            this.render();
        });

        // Converter events
        document.getElementById('conv-amount').addEventListener('input', () => this.updateConversion());
        document.getElementById('conv-from').addEventListener('change', () => this.updateConversion());
        document.getElementById('conv-to').addEventListener('change', () => this.updateConversion());
    },

    updateSavingTypeToggle(type) {
        document.querySelectorAll('.saving-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
    },

    async deleteSaving(id) {
        const confirmed = await App.confirm('Удалить эту запись?');
        if (confirmed) {
            Store.deleteSaving(id);
            this.render();
        }
    }
};

function formatNumber(n) {
    return new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(n);
}
