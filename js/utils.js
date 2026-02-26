/* ===== Utility functions ===== */

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const CURRENCY_SYMBOLS = {
    BYN: 'Br',
    RUB: '\u20bd',
    USD: '$',
    EUR: '\u20ac'
};

function formatMoney(amount, currency) {
    const sym = CURRENCY_SYMBOLS[currency] || currency;
    const formatted = new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(Math.abs(amount));
    return `${amount < 0 ? '-' : ''}${formatted} ${sym}`;
}

function convertToByn(amount, currency) {
    if (currency === 'BYN') return amount;
    const rates = Store.getSettings().exchangeRates;
    const rate = rates[currency] || 1;
    return amount * rate;
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function formatDateFull(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatMonthYear(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
}

function getCurrentMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getTodayDate() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getMonthRange(monthStr) {
    const [year, month] = monthStr.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return {
        start: `${year}-${String(month).padStart(2, '0')}-01`,
        end: `${year}-${String(month).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
    };
}

function filterTransactionsByMonth(transactions, monthStr) {
    const { start, end } = getMonthRange(monthStr);
    return transactions.filter(t => t.date >= start && t.date <= end);
}

function filterTransactionsByPeriod(transactions, period) {
    const now = new Date();
    let startDate;
    if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'quarter') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    } else {
        startDate = new Date(now.getFullYear(), 0, 1);
    }
    const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-01`;
    return transactions.filter(t => t.date >= startStr);
}

function getCategoryEmoji(category) {
    const map = {
        'Еда': '\uD83C\uDF54',
        'Транспорт': '\uD83D\uDE97',
        'Жильё': '\uD83C\uDFE0',
        'Развлечения': '\uD83C\uDFAC',
        'Одежда': '\uD83D\uDC55',
        'Здоровье': '\uD83D\uDC8A',
        'Подписки': '\uD83D\uDCF1',
        'Зарплата': '\uD83D\uDCB0',
        'Подработка': '\uD83D\uDCBB',
        'Инвестиции': '\uD83D\uDCC8',
        'Сбережение': '\uD83D\uDCB0',
        'Другое': '\uD83D\uDCCC'
    };
    return map[category] || '\uD83D\uDCCC';
}

const CHART_COLORS = [
    '#6c5ce7', '#00b894', '#e17055', '#fdcb6e',
    '#0984e3', '#e84393', '#00cec9', '#636e72',
    '#d63031', '#a29bfe', '#55efc4', '#fab1a0'
];
