// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Telegram Mini App
    if (window.Telegram && window.Telegram.WebApp) {
        Telegram.WebApp.ready();
    }

    // Check if the app is opened from Telegram
    if (!window.Telegram || !window.Telegram.WebApp || !window.Telegram.WebApp.initDataUnsafe || !window.Telegram.WebApp.initDataUnsafe.query_id) {
        renderErrorPage();
    } else {
        initApp();
    }
});

function renderErrorPage() {
    document.body.innerHTML = `
        <div class="container error-container">
            <svg class="telegram-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.2647 2.42778C21.98 2.19091 21.6364 2.03567 21.2704 1.97858C20.9044 1.92149 20.5293 1.96469 20.1847 2.10361L2.26466 9.33605C1.88159 9.49402 1.55729 9.76401 1.33534 10.1108C1.11339 10.4576 1.00195 10.8654 1.01674 11.2782C1.03152 11.691 1.17193 12.09 1.41991 12.4201C1.66789 12.7502 2.01212 12.9957 2.40632 13.1233L6.73232 14.3543L8.72832 20.6837C8.75354 20.7557 8.78866 20.8237 8.83266 20.8857C8.84656 20.9036 8.86189 20.9199 8.87832 20.9355C8.92057 20.9876 8.96828 21.0339 9.02066 21.0737C9.03606 21.0852 9.05102 21.0975 9.06706 21.1083C9.13205 21.1542 9.20247 21.1918 9.27666 21.2203C9.29556 21.2274 9.31346 21.2364 9.33266 21.2423C9.41933 21.2718 9.50889 21.2903 9.59966 21.2973C9.61311 21.2982 9.62626 21.3007 9.63986 21.3011C9.64919 21.3015 9.65823 21.3031 9.66762 21.3033C9.7495 21.3064 9.83152 21.3004 9.91226 21.2857C9.93842 21.2807 9.96345 21.2725 9.98874 21.2654C10.0629 21.2462 10.1346 21.2198 10.2027 21.1865C10.2196 21.1778 10.2372 21.1707 10.2537 21.1613C10.2862 21.1431 10.3142 21.1212 10.3443 21.1003L13.6783 18.1553L18.7473 21.7273C19.1099 21.9836 19.5454 22.1137 19.9907 22.0995C20.4361 22.0853 20.8622 21.9276 21.2079 21.6479C21.5536 21.3683 21.8003 20.9816 21.9103 20.5454C22.0203 20.1092 21.9875 19.6486 21.8177 19.2337L22.2647 2.42778ZM10.0387 14.8559C9.95481 14.9262 9.89215 15.0172 9.85744 15.1201L9.28144 17.1891L8.41134 14.0675L13.5323 11.7085L10.0387 14.8559Z" fill="#3390EC"/>
            </svg>
            <h1>Invoice Manager</h1>
            <p>This app can only be opened from Telegram.</p>
        </div>
    `;
    document.body.classList.add('error-page');
}

function initApp() {
    // User authorization
    const user = Telegram.WebApp.initDataUnsafe.user;
    const queryId = Telegram.WebApp.initDataUnsafe.query_id;

    // Main app logic
    function renderMainPage() {
        const invoices = getInvoices();
        const totalIncome = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.amount), 0);

        const appContainer = document.getElementById('app');
        appContainer.innerHTML = `
            <div class="container">
                <h1 class="app-title">Invoice Manager <span class="user-name">${user.first_name}</span></h1>
                <div class="total-income">
                    <h2>Total Income</h2>
                    <div class="amount">$${totalIncome.toFixed(2)}</div>
                </div>
                <h3>Latest Invoices</h3>
                <div class="invoice-list">
                    ${renderInvoiceList(invoices.slice(-3))}
                </div>
                <button class="button view-all-btn" onclick="viewAllInvoices()">View All</button>
                <button class="button create-invoice-btn" onclick="createInvoice()">Create Invoice</button>
            </div>
        `;

        Telegram.WebApp.BackButton.hide();
        setupMainButton('Create Invoice', createInvoice);
    }

    function renderInvoiceList(invoices) {
        if (invoices.length === 0) {
            return '<p>No invoices yet.</p>';
        }
        return invoices.map(invoice => `
            <div class="invoice-item" onclick="viewInvoice(${invoice.id})">
                <span>Invoice #${invoice.id}</span>
                <span>$${parseFloat(invoice.amount).toFixed(2)}</span>
                <span>${invoice.status}</span>
            </div>
        `).join('');
    }

    function createInvoice() {
        renderCreateInvoicePage();
    }

    function renderCreateInvoicePage() {
        const appContainer = document.getElementById('app');
        appContainer.innerHTML = `
            <div class="container">
                <h2>Create Invoice</h2>
                <form id="create-invoice-form">
                    <input type="number" id="invoice-amount" placeholder="Amount" required step="0.01">
                    <input type="text" id="invoice-description" placeholder="Description" required>
                    <input type="date" id="invoice-date" required>
                    <select id="invoice-status">
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Paid">Paid</option>
                    </select>
                </form>
            </div>
        `;

        Telegram.WebApp.BackButton.show();
        Telegram.WebApp.BackButton.onClick(renderMainPage);
        setupMainButton('Save Invoice', saveInvoice);
    }

    function saveInvoice() {
        const amount = document.getElementById('invoice-amount').value;
        const description = document.getElementById('invoice-description').value;
        const date = document.getElementById('invoice-date').value;
        const status = document.getElementById('invoice-status').value;
        
        if (amount && description && date) {
            const newInvoice = { 
                id: Date.now(), 
                amount: parseFloat(amount).toFixed(2), 
                description, 
                date, 
                status 
            };
            addInvoiceToStorage(newInvoice);
            Telegram.WebApp.showAlert('Invoice created successfully!');
            renderMainPage();
        } else {
            Telegram.WebApp.showAlert('Please fill in all fields.');
        }
    }

    function viewAllInvoices() {
        const invoices = getInvoices();
        const appContainer = document.getElementById('app');
        appContainer.innerHTML = `
            <div class="container">
                <h2>All Invoices</h2>
                <div class="invoice-list">
                    ${renderInvoiceList(invoices)}
                </div>
            </div>
        `;

        Telegram.WebApp.BackButton.show();
        Telegram.WebApp.BackButton.onClick(renderMainPage);
        hideMainButton();
    }

    function viewInvoice(id) {
        const invoices = getInvoices();
        const invoice = invoices.find(inv => inv.id === id);
        
        if (!invoice) {
            Telegram.WebApp.showAlert('Invoice not found.');
            return;
        }

        const appContainer = document.getElementById('app');
        appContainer.innerHTML = `
            <div class="container">
                <h2>Invoice #${invoice.id}</h2>
                <p>Amount: $${parseFloat(invoice.amount).toFixed(2)}</p>
                <p>Description: ${invoice.description}</p>
                <p>Date: ${invoice.date}</p>
                <p>Status: ${invoice.status}</p>
                <button class="button" onclick="editInvoice(${invoice.id})">Edit</button>
                <button class="button" onclick="deleteInvoice(${invoice.id})">Delete</button>
                <button class="button" onclick="downloadPDF(${invoice.id})">Download PDF</button>
            </div>
        `;

        Telegram.WebApp.BackButton.show();
        Telegram.WebApp.BackButton.onClick(renderMainPage);
        hideMainButton();
    }

    function getInvoices() {
        const invoices = localStorage.getItem('invoices');
        return invoices ? JSON.parse(invoices) : [];
    }

    function addInvoiceToStorage(invoice) {
        const invoices = getInvoices();
        invoices.push(invoice);
        localStorage.setItem('invoices', JSON.stringify(invoices));
    }

    function setupMainButton(text, onClick) {
        Telegram.WebApp.MainButton.setText(text);
        Telegram.WebApp.MainButton.onClick(onClick);
        Telegram.WebApp.MainButton.show();
    }

    function hideMainButton() {
        Telegram.WebApp.MainButton.hide();
    }

    // Initial render
    renderMainPage();
}

// Placeholder functions for future implementation
function editInvoice(id) {
    console.log(`Edit invoice ${id}`);
    // Implement edit functionality
}

function deleteInvoice(id) {
    console.log(`Delete invoice ${id}`);
    // Implement delete functionality
}

function downloadPDF(id) {
    console.log(`Download PDF for invoice ${id}`);
    // Implement PDF download functionality
}