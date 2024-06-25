// Global variables
let user;
let queryId;

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
    user = Telegram.WebApp.initDataUnsafe.user;
    queryId = Telegram.WebApp.initDataUnsafe.query_id;
    renderMainPage();
}

function renderMainPage() {
    const invoices = getInvoices();
    const totalIncome = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.amount), 0);

    const appContainer = document.getElementById('app');
    appContainer.innerHTML = `
        <div class="container">
            <div class="header">
                <h1 class="app-title">Invoice Manager</h1>
                <button class="settings-button" id="settingsButton" onclick="openSettings()">⚙️</button>
            </div>
            <p class="user-name">Welcome, ${user.first_name}</p>
            <div class="total-income">
                <h2>Total Income</h2>
                <div class="amount">$${totalIncome.toFixed(2)}</div>
            </div>
            ${renderInvoiceList(invoices.slice(-3))}
        </div>
    `;

    Telegram.WebApp.BackButton.hide();
    clearMainButton();
    setupMainButton('Create Invoice', createInvoice);
    initSearch();
}

function renderInvoiceList(invoices) {
    const hasInvoices = invoices.length > 0;
    return `
        <div class="recent-invoices-block">
            <div class="recent-invoices-header">
                <h3>RECENT INVOICES</h3>
                ${hasInvoices ? `<button class="text-button" onclick="viewAllInvoices()">View All</button>` : ''}
            </div>
            <div class="recent-invoices ${hasInvoices ? '' : 'empty'}">
                ${hasInvoices ? renderInvoices(invoices) : `
                    <div class="empty-state">
                        <div class="icon">⇄</div>
                        <p>No recent invoices</p>
                        <a href="#" onclick="createInvoice(); return false;">Create an Invoice</a>
                    </div>
                `}
            </div>
        </div>
    `;
}

function renderInvoices(invoices) {
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
                <input type="number" id="invoice-amount" name="invoice-amount" placeholder="Amount" required step="0.01">
                <input type="text" id="invoice-description" name="invoice-description" placeholder="Description" required>
                <input type="date" id="invoice-date" name="invoice-date" required>
                <select id="invoice-status" name="invoice-status">
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
    try {
        const form = document.getElementById('create-invoice-form');
        const formData = new FormData(form);
        validateForm(formData);

        const newInvoice = {
            id: Date.now(),
            amount: parseFloat(formData.get('invoice-amount')).toFixed(2),
            description: formData.get('invoice-description'),
            date: formData.get('invoice-date'),
            status: formData.get('invoice-status')
        };

        addInvoiceToStorage(newInvoice);
        Telegram.WebApp.showAlert('Invoice created successfully!');
        renderMainPage();
    } catch (error) {
        handleError(error);
    }
}

function viewAllInvoices() {
    const invoices = getInvoices();
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = `
        <div class="container">
            <h2>All Invoices</h2>
            <div class="invoice-list">
                ${renderInvoices(invoices)}
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

function openSettings() {
    renderSettingsPage('business');
}

function renderSettingsPage(activeTab = 'business') {
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = `
        <div class="container settings-page">
            <div class="tabs">
                <button class="tab-button ${activeTab === 'business' ? 'active' : ''}" onclick="renderSettingsPage('business')">Business</button>
                <button class="tab-button ${activeTab === 'general' ? 'active' : ''}" onclick="renderSettingsPage('general')">General</button>
            </div>
            <div class="tab-content">
                ${activeTab === 'business' ? renderBusinessSettings() : renderGeneralSettings()}
            </div>
        </div>
    `;

    Telegram.WebApp.BackButton.show();
    Telegram.WebApp.BackButton.onClick(renderMainPage);
    hideMainButton();
}

function renderBusinessSettings() {
    const businessInfo = getBusinessInfo();
    return `
        <div class="settings-section">
            <h3>Business Information</h3>
            <p>Business Name: ${businessInfo.name}</p>
            <p>${businessInfo.address.country || 'Country not set'}</p>
            <button class="button" onclick="editBusinessInfo()">Edit business info</button>
        </div>
        <div class="settings-section">
            <h3>Subscription</h3>
            <p class="placeholder">Premium placeholder</p>
        </div>
        <div class="settings-section">
            <h3>Sales</h3>
            <ul>
                <li><a href="#" onclick="openCustomers()">Customers</a></li>
                <li><a href="#" onclick="openProductsServices()">Products and services</a></li>
                <li><a href="#" onclick="openSalesTaxes()">Sales taxes</a></li>
            </ul>
        </div>
    `;
}

function renderGeneralSettings() {
    return `
        <div class="settings-section">
            <h3>Language</h3>
            <select id="language-select">
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
            </select>
        </div>
        <div class="settings-section">
            <h3>Default Currency</h3>
            <select id="currency-select">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
            </select>
        </div>
        <div class="settings-section">
            <h3>Support</h3>
            <button class="button" onclick="contactSupport()">Contact Support</button>
        </div>
    `;
}

function editBusinessInfo() {
    const businessInfo = getBusinessInfo();
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = `
        <div class="container">
            <h2>Edit Business Information</h2>
            <p>This business info will be shown on all existing and future invoices and estimates.</p>
            <form id="edit-business-info-form">
                <label for="business-name">Business Name</label>
                <input type="text" id="business-name" name="business-name" maxlength="50" value="${businessInfo.name}" required>
                
                <h3>Additional Info (optional)</h3>
                
                <button type="button" class="button" onclick="editAddress()">Address</button>
                <button type="button" class="button" onclick="editContact()">Contact</button>
            </form>
        </div>
    `;

    Telegram.WebApp.BackButton.show();
    Telegram.WebApp.BackButton.onClick(() => {
        clearMainButton();
        renderSettingsPage('business');
    });

    // Set up the MainButton for saving
    setupMainButton('Save', saveBusinessInfoHandler);
}

function saveBusinessInfoHandler() {
    const form = document.getElementById('edit-business-info-form');
    const formData = new FormData(form);
    const businessInfo = getBusinessInfo();
    const updatedInfo = {
        name: formData.get('business-name'),
        address: businessInfo.address,
        contact: businessInfo.contact
    };
    saveBusinessInfo(updatedInfo);
    Telegram.WebApp.showAlert('Business information updated successfully!');
    renderSettingsPage('business');
}

function editAddress() {
    const businessInfo = getBusinessInfo();
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = `
        <div class="container">
            <h2>Edit Address</h2>
            <form id="edit-address-form">
                <input type="text" id="street" name="street" placeholder="Street" value="${businessInfo.address?.street || ''}" required>
                <input type="text" id="city" name="city" placeholder="City" value="${businessInfo.address?.city || ''}" required>
                <input type="text" id="state" name="state" placeholder="State" value="${businessInfo.address?.state || ''}" required>
                <input type="text" id="zip" name="zip" placeholder="ZIP Code" value="${businessInfo.address?.zip || ''}" required>
                <input type="text" id="country" name="country" placeholder="Country" value="${businessInfo.address?.country || ''}" required>
                <button type="submit" class="button">Save Address</button>
            </form>
        </div>
    `;

    Telegram.WebApp.BackButton.show();
    Telegram.WebApp.BackButton.onClick(() => {
        clearMainButton();
        editBusinessInfo();
    });

    // Set up the MainButton for saving
    setupMainButton('Save', saveAddressHandler);
}

function saveAddressHandler() {
        const form = document.getElementById('edit-address-form');
        const formData = new FormData(form);
        const updatedAddress = {
            street: formData.get('street'),
            city: formData.get('city'),
            state: formData.get('state'),
            zip: formData.get('zip'),
            country: formData.get('country')
        };
        const businessInfo = getBusinessInfo();
        businessInfo.address = updatedAddress;
        saveBusinessInfo(businessInfo);
        Telegram.WebApp.showAlert('Address updated successfully!');
        editBusinessInfo();
}

function editContact() {
    const businessInfo = getBusinessInfo();
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = `
        <div class="container">
            <h2>Edit Contact</h2>
            <form id="edit-contact-form">
                <input type="email" id="email" name="email" placeholder="Email" value="${businessInfo.contact?.email || ''}" required>
                <input type="tel" id="phone" name="phone" placeholder="Phone" value="${businessInfo.contact?.phone || ''}" required>
                <input type="text" id="website" name="website" placeholder="Website" value="${businessInfo.contact?.website || ''}">
                <button type="submit" class="button">Save Contact</button>
            </form>
        </div>
    `;

    Telegram.WebApp.BackButton.show();
    Telegram.WebApp.BackButton.onClick(() => {
        clearMainButton();
        editBusinessInfo();
    });

    // Set up the MainButton for saving
    setupMainButton('Save', saveContactHandler);
}

function saveContactHandler() {
        const form =document.getElementById('edit-contact-form')
        const formData = new FormData(form);
        const updatedContact = {
            email: formData.get('email'),
            phone: formData.get('phone'),
            website: formData.get('website')
        };
        const businessInfo = getBusinessInfo();
        businessInfo.contact = updatedContact;
        saveBusinessInfo(businessInfo);
        Telegram.WebApp.showAlert('Contact information updated successfully!');
        editBusinessInfo();
}

function getBusinessInfo() {
    const info = localStorage.getItem('businessInfo');
    return info ? JSON.parse(info) : {
        name: user.first_name, // Default to user's first name from Telegram data
        address: null,
        contact: null
    };
}

function saveBusinessInfo(info) {
    localStorage.setItem('businessInfo', JSON.stringify(info));
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
    clearMainButton()
    Telegram.WebApp.MainButton.setText(text);
    Telegram.WebApp.MainButton.onClick(onClick);
    Telegram.WebApp.MainButton.show();
}

function clearMainButton() {
    Telegram.WebApp.MainButton.offClick(Telegram.WebApp.MainButton.onClick);
    Telegram.WebApp.MainButton.hide();
}

function hideMainButton() {
    Telegram.WebApp.MainButton.hide();
}

function editInvoice(id) {
    console.log(`Edit invoice ${id}`);
    // Implement edit functionality
}

function deleteInvoice(id) {
    confirmAction('Are you sure you want to delete this invoice?', () => {
        console.log(`Deleting invoice ${id}`);
        // Implement actual delete functionality here
        renderMainPage();
    });
}

function downloadPDF(id) {
    console.log(`Download PDF for invoice ${id}`);
    // Implement PDF download functionality
}

function openCustomers() {
    console.log("Open customers");
    // Implement open customers functionality
}

function openProductsServices() {
    console.log("Open products and services");
    // Implement open products and services functionality
}

function openSalesTaxes() {
    console.log("Open sales taxes");
    // Implement open sales taxes functionality
}

function contactSupport() {
    console.log("Contact support");
    // Implement contact support functionality
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function updateLanguage(language) {
    console.log(`Updating language to ${language}`);
    // Implement language change functionality
}

function updateCurrency(currency) {
    console.log(`Updating currency to ${currency}`);
    // Implement currency change functionality
}

document.addEventListener('change', function(event) {
    if (event.target.id === 'language-select') {
        updateLanguage(event.target.value);
    } else if (event.target.id === 'currency-select') {
        updateCurrency(event.target.value);
    }
});

function handleError(error) {
    console.error('An error occurred:', error);
    Telegram.WebApp.showAlert(`An error occurred: ${error.message}`);
}

function showLoading() {
    const loadingElement = document.createElement('div');
    loadingElement.id = 'loading';
    loadingElement.textContent = 'Loading...';
    document.body.appendChild(loadingElement);
}

function hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.remove();
    }
}

function confirmAction(message, onConfirm) {
    Telegram.WebApp.showConfirm(message, (confirmed) => {
        if (confirmed) {
            onConfirm();
        }
    });
}

function validateForm(formData) {
    for (let [key, value] of formData.entries()) {
        if (!value) {
            throw new Error(`${key} is required`);
        }
    }
}

function searchInvoices(query) {
    const invoices = getInvoices();
    return invoices.filter(invoice => 
        invoice.description.toLowerCase().includes(query.toLowerCase()) ||
        invoice.id.toString().includes(query)
    );
}

function renderSearchResults(results) {
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = `
        <div class="container">
            <h2>Search Results</h2>
            <div class="invoice-list">
                ${results.length > 0 ? renderInvoices(results) : '<p>No results found</p>'}
            </div>
            <button class="button" onclick="renderMainPage()">Back to Main</button>
        </div>
    `;
}

function initSearch() {
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search invoices...';
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        if (query.length >= 3) {
            const results = searchInvoices(query);
            renderSearchResults(results);
        } else if (query.length === 0) {
            renderMainPage();
        }
    });
    document.querySelector('.header').appendChild(searchInput);
}

// Make sure these functions are available in the global scope
window.openSettings = openSettings;
window.viewAllInvoices = viewAllInvoices;
window.createInvoice = createInvoice;
window.editInvoice = editInvoice;
window.deleteInvoice = deleteInvoice;
window.downloadPDF = downloadPDF;
window.editBusinessInfo = editBusinessInfo;
window.openCustomers = openCustomers;
window.openProductsServices = openProductsServices;
window.openSalesTaxes = openSalesTaxes;
window.contactSupport = contactSupport;
window.renderSettingsPage = renderSettingsPage;
window.editAddress = editAddress;
window.editContact = editContact;

// Initialize the app
initApp();