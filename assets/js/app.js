const balanceEl = document.getElementById('balance');
const incomeTotalEl = document.getElementById('income-total');
const expenseTotalEl = document.getElementById('expense-total');
const transactionListEl = document.getElementById('transaction-list');
const descriptionEl = document.getElementById('description');
const amountEl = document.getElementById('amount');
const categoryEl = document.getElementById('category');
const addTransactionBtn = document.getElementById('add-transaction-btn');
const categoryFilterEl = document.getElementById('category-filter');
const transactionTypeEl = document.getElementById('transaction-type');
const recurringCheckbox = document.getElementById('recurring-checkbox');
const recurringIntervalEl = document.getElementById('recurring-interval');
const exportCsvBtn = document.getElementById('export-csv-btn');
const csvFileInput = document.getElementById('csv-file');
const importCsvBtn = document.getElementById('import-csv-btn');
const editModal = document.getElementById('editModal');
const editDescriptionEl = document.getElementById('edit-description');
const editAmountEl = document.getElementById('edit-amount');
const editTransactionTypeEl = document.getElementById('edit-transaction-type');
const editCategoryEl = document.getElementById('edit-category');
const deleteAllBtn = document.getElementById('delete-all-btn');

const darkModeToggle = document.getElementById('dark-mode-toggle');

const isDarkMode = localStorage.getItem('darkMode') === 'enabled';


let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let transactionChart;
let editIndex = null;
let expenseCategoryChart;

// Categories for income and expense
const incomeCategories = ['Salary', 'Bonus', 'Freelance', 'Other'];
const expenseCategories = ['Rent', 'Food', 'Utilities', 'Entertainment', 'Other'];


// Function to enable dark mode
function enableDarkMode() {
    document.body.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'enabled');
}

// Function to disable dark mode
function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', 'disabled');
}

// Set the initial state based on localStorage
if (isDarkMode) {
    enableDarkMode();
    darkModeToggle.checked = true;
}

// Event listener for the dark mode toggle
darkModeToggle.addEventListener('change', () => {
    if (darkModeToggle.checked) {
        enableDarkMode();
    } else {
        disableDarkMode();
    }
});


// Show the edit modal and populate with data
function openEditModal(index) {
    const transaction = transactions[index];

    // Add a null check here
    if (!transaction) {
        console.error(`Transaction at index ${index} is null or undefined`);
        return; // Exit the function if no transaction is found
    }

    editDescriptionEl.value = transaction.description;
    editAmountEl.value = transaction.amount;
    editTransactionTypeEl.value = transaction.type;
    editIndex = index;
    updateEditCategoryOptions();
    editCategoryEl.value = transaction.category;
    editModal.style.display = 'block';
}


// Close the edit modal
function closeEditModal() {
    editModal.style.display = 'none';
    editIndex = null;
}


function updateExpenseCategoryChart() {
    const ctx = document.getElementById('expenseCategoryChart').getContext('2d');

    // Filter the transactions to only get expenses
    const expenseTransactions = transactions.filter(transaction => transaction && transaction.type === 'expense');

    // Calculate total amount spent in each category
    const expenseData = expenseCategories.map(category => {
        const total = expenseTransactions
            .filter(transaction => transaction.category === category)
            .reduce((sum, transaction) => sum + transaction.amount, 0);
        return total;
    });

    // Remove old chart if it exists
    if (expenseCategoryChart) {
        expenseCategoryChart.destroy();
    }

    // Define colors for each category
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

    // Create the Doughnut chart with legend on top
    expenseCategoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: expenseCategories,
            datasets: [{
                data: expenseData,
                backgroundColor: colors,
                borderColor: colors.map(color => color.replace('FF', 'AA')),
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: true,
                    position: 'top',  // Move the legend above the chart
                    labels: {
                        boxWidth: 20,  // Adjust the box size of the legend
                        padding: 15,   // Adjust padding for spacing
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false,
        }
    });
}


// Open the modal when clicking "Edit"
function editTransaction(index) {
    const transaction = transactions[index];

    // Fill the form with transaction data
    descriptionEl.value = transaction.description;
    amountEl.value = transaction.amount;
    transactionTypeEl.value = transaction.type;
    updateCategoryOptions();
    categoryEl.value = transaction.category;

    if (transaction.isRecurring) {
        recurringCheckbox.checked = true;
        recurringIntervalEl.disabled = false;
        recurringIntervalEl.value = transaction.recurringInterval;
    }

    // Remove the old transaction
    transactions.splice(index, 1);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    updateUI();

    // Scroll to form and show hint
    scrollToAddTransaction();
    showNotification('Edit your transaction and click "Add Transaction" to save changes');
}

// Updated function for editing categories in the modal
function updateEditCategoryOptions() {
    const selectedType = editTransactionTypeEl.value;
    editCategoryEl.innerHTML = '';
    const categories = selectedType === 'income' ? incomeCategories : expenseCategories;
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        editCategoryEl.appendChild(option);
    });
}

function updateChart() {
    const income = transactions
        .filter(transaction => transaction && transaction.type === 'income') // Add transaction check
        .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

    const expenses = transactions
        .filter(transaction => transaction && transaction.type === 'expense') // Add transaction check
        .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);


    const ctx = document.getElementById('transactionChart').getContext('2d');

    if (transactionChart) {
        transactionChart.destroy();
    }

    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#ffffff' : '#000000';

    transactionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                label: 'Amount ($)',
                data: [income, expenses],
                backgroundColor: ['#28a745', '#dc3545'],
                borderColor: ['#28a745', '#dc3545'],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor
                    }
                },
                x: {
                    ticks: {
                        color: textColor
                    }
                }
            },
            plugins: {
                legend: {
                    display: false,
                    labels: {
                        color: textColor
                    }
                }
            },
            responsive: true,
        }
    });
}

function handleDarkModeToggle() {
    const darkModeIcon = document.getElementById('dark-mode-toggle');

    // Check if dark mode is enabled
    const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
    if (isDarkMode) {
        enableDarkMode();
    }

    // Update chart and icon when dark mode is toggled
    darkModeIcon.addEventListener('click', () => {
        if (document.body.classList.contains('dark-mode')) {
            disableDarkMode();
            darkModeIcon.classList.replace('fa-sun', 'fa-moon');
        } else {
            enableDarkMode();
            darkModeIcon.classList.replace('fa-moon', 'fa-sun');
        }
    });
}

function enableDarkMode() {
    document.body.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'enabled');
    updateChart();
}

function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', 'disabled');
    updateChart();
}

handleDarkModeToggle();

updateChart();


// Function to dynamically update the categories based on transaction type
function updateCategoryOptions() {
    const selectedType = transactionTypeEl.value;

    // Clear existing categories
    categoryEl.innerHTML = '';

    // Get appropriate categories based on type
    const categories = selectedType === 'income' ? incomeCategories : expenseCategories;

    // Add categories to the dropdown
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryEl.appendChild(option);
    });
}

// Call the function initially to populate the categories when the page loads
updateCategoryOptions();

function formatAmount(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function scrollToAddTransaction() {
    const addTransactionForm = document.querySelector('.transaction-form');
    addTransactionForm.scrollIntoView({ behavior: 'smooth' });
}

function showScrollHint() {
    const hint = document.createElement('div');
    hint.className = 'scroll-hint';
    hint.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 15l7-7 7 7"/>
        </svg>
        Click here to add a new transaction
    `;
    hint.addEventListener('click', () => {
        scrollToAddTransaction();
        hint.remove();
    });
    document.body.appendChild(hint);
    setTimeout(() => hint.remove(), 5000);
}

// Call updateChart inside the updateUI function to refresh the chart when the UI updates
function updateUI() {
    let income = 0, expenses = 0;
    const transactionListEl = document.getElementById('transaction-list');
    transactionListEl.innerHTML = '';

    const filterCategory = categoryFilterEl.value;

    // Filter out null or undefined transactions before sorting
    const validTransactions = transactions.filter(transaction => transaction !== null && transaction !== undefined);

    const sortedTransactions = [...validTransactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const fragment = document.createDocumentFragment();

    sortedTransactions.forEach((transaction, index) => {
        if (!transaction) {
            console.warn(`Transaction at index ${index} is null or undefined`);
            return;
        }

        if (filterCategory !== 'all' && transaction.category !== filterCategory) {
            return;
        }

        if (transaction.type === 'income') {
            income += transaction.amount;
        } else {
            expenses += transaction.amount;
        }

        const transactionEl = document.createElement('div');
        transactionEl.className = 'transaction-item';
        const formattedDate = new Date(transaction.timestamp).toLocaleDateString();

        const recurringIcon = transaction.isRecurring
            ? `<i class="fas fa-repeat recurring-icon"></i>`
            : '';

        transactionEl.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-type-icon ${transaction.type}">
                    ${transaction.type === 'income' ?
                '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>' :
                '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>'
            }
                </div>
                <div class="transaction-details">
                    <span class="transaction-description">${transaction.description}</span>
                    <span class="transaction-category">${transaction.category}</span>
                    ${recurringIcon}
                    <span class="transaction-timestamp">${formattedDate}</span>
                </div>
            </div>
            <div class="transaction-actions">
                <span class="transaction-amount ${transaction.type}">
                    ${formatAmount(transaction.amount)}
                </span>
                <button class="action-button edit" onclick="editTransaction(${index})" aria-label="Edit transaction">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" 
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                    </svg>
                </button>
                <button class="action-button delete" onclick="removeTransaction(${index})" aria-label="Delete transaction">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" 
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                </button>
            </div>
        `;
        fragment.appendChild(transactionEl);
    });

    transactionListEl.appendChild(fragment);

    const balance = income - expenses;
    balanceEl.textContent = formatAmount(balance).replace('$', '');
    incomeTotalEl.textContent = formatAmount(income).replace('$', '');
    expenseTotalEl.textContent = formatAmount(expenses).replace('$', '');

    updateChart();
    updateExpenseCategoryChart();  // Update the Doughnut chart
}



// Function to edit a transaction
function editTransaction(index) {
    const transaction = transactions[index];

    // Populate the form with the transaction's current details
    descriptionEl.value = transaction.description;
    amountEl.value = transaction.amount;
    transactionTypeEl.value = transaction.type;
    updateCategoryOptions();  // Update categories based on type
    categoryEl.value = transaction.category;

    // Handle recurring transaction details
    recurringCheckbox.checked = transaction.isRecurring;
    recurringIntervalEl.disabled = !transaction.isRecurring;
    recurringIntervalEl.value = transaction.recurringInterval || 'monthly';

    // Remove the old transaction
    transactions.splice(index, 1);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    updateUI();
}

// Function to add a new transaction
function addTransaction() {
    const description = descriptionEl.value.trim();
    const amount = parseFloat(amountEl.value);
    const type = transactionTypeEl.value;
    const category = categoryEl.value;

    // Recurring details
    const isRecurring = recurringCheckbox.checked;
    const recurringInterval = recurringCheckbox.checked ? recurringIntervalEl.value : null;

    if (!description || isNaN(amount)) {
        alert('Please enter valid description and amount.');
        return;
    }

    const transaction = {
        description,
        amount,
        type,
        category,
        isRecurring,
        recurringInterval,
        timestamp: new Date().toISOString()
    };

    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    updateUI();

    // Clear input fields
    descriptionEl.value = '';
    amountEl.value = '';
    recurringCheckbox.checked = false;
    recurringIntervalEl.disabled = true;

    // Show notification for successful transaction addition
    showNotification('Transaction added successfully!', 'success');
}


// Function to remove a transaction
function removeTransaction(index) {
    const transactionEl = document.querySelectorAll('.transaction-item')[index];
    transactionEl.classList.add('deleting');

    setTimeout(() => {
        transactions.splice(index, 1);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        updateUI();
        showNotification('Transaction deleted successfully');
    }, 300);
}

// Function to handle recurring transactions on a set interval
function processRecurringTransactions() {
    const currentDate = new Date();

    transactions.forEach(transaction => {
        // Check if the transaction is valid
        if (!transaction) {
            console.warn("Skipping null transaction in processRecurringTransactions.");
            return;
        }

        if (transaction.isRecurring) {
            const lastAddedDate = transaction.lastAddedDate ? new Date(transaction.lastAddedDate) : null;
            let shouldAdd = false;

            if (transaction.recurringInterval === 'daily' && (!lastAddedDate || (currentDate - lastAddedDate) >= 24 * 60 * 60 * 1000)) {
                shouldAdd = true;
            } else if (transaction.recurringInterval === 'weekly' && (!lastAddedDate || (currentDate - lastAddedDate) >= 7 * 24 * 60 * 60 * 1000)) {
                shouldAdd = true;
            } else if (transaction.recurringInterval === 'monthly' && (!lastAddedDate || (currentDate.getMonth() !== lastAddedDate.getMonth()))) {
                shouldAdd = true;
            }

            if (shouldAdd) {
                transactions.push({
                    description: transaction.description,
                    amount: transaction.amount,
                    type: transaction.type,
                    category: transaction.category,
                    isRecurring: transaction.isRecurring,
                    recurringInterval: transaction.recurringInterval,
                    lastAddedDate: currentDate.toISOString()
                });
            }
        }
    });

    // Save updated transactions and refresh UI
    localStorage.setItem('transactions', JSON.stringify(transactions));
    updateUI();
}



function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem',
        borderRadius: '0.5rem',
        backgroundColor: type === 'success' ? '#10B981' : '#EF4444',
        color: 'white',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        zIndex: '1000',
        animation: 'slideIn 0.3s ease-out'
    });

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Function to export transactions to CSV
function exportToCSV() {
    const csvRows = [];
    const headers = ['Description', 'Amount', 'Type', 'Category', 'IsRecurring', 'RecurringInterval'];
    csvRows.push(headers.join(','));

    transactions.forEach(transaction => {
        const row = [
            `"${transaction.description}"`,
            transaction.amount,
            transaction.type,
            transaction.category,
            transaction.isRecurring ? 'Yes' : 'No',
            transaction.recurringInterval || ''
        ];
        csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'transactions.csv');
    a.click();

    // Show the success notification after the export is triggered
    showNotification('CSV exported successfully!', 'success');
}


// Function to import transactions from CSV
function importFromCSV(event) {
    const file = event.target.files[0];
    if (!file) {
        alert('Please select a file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const csvText = e.target.result;
            const rows = csvText.split('\n').filter(row => row.trim());

            const newTransactions = rows.slice(1).map(row => {
                const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

                return {
                    description: columns[0].replace(/"/g, '').trim(),
                    amount: parseFloat(columns[1]),
                    type: columns[2].trim(),
                    category: columns[3].trim(),
                    isRecurring: columns[4].trim() === 'Yes',
                    recurringInterval: columns[5] ? columns[5].trim() : null
                };
            });

            const validTransactions = newTransactions.filter(transaction =>
                transaction.description &&
                !isNaN(transaction.amount) &&
                ['income', 'expense'].includes(transaction.type)
            );

            if (validTransactions.length === 0) {
                throw new Error('No valid transactions found in the CSV file');
            }

            transactions.push(...validTransactions);
            localStorage.setItem('transactions', JSON.stringify(transactions));
            updateUI();

            showNotification('Successfully imported ' + validTransactions.length + ' transactions!');
            document.getElementById('csv-file').value = '';

        } catch (error) {
            console.error('Error importing CSV:', error);
            showNotification('Error importing CSV file. Please check the file format.', 'error');
        }
    };

    reader.onerror = function () {
        showNotification('Error reading the file. Please try again.', 'error');
    };

    reader.readAsText(file);
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add Title
    doc.setFontSize(20);
    doc.text("Transaction Report", 10, 10);

    let y = 20;

    doc.setFontSize(12);
    doc.text("Description", 10, y);
    doc.text("Amount", 60, y);
    doc.text("Type", 100, y);
    doc.text("Category", 130, y);
    doc.text("Recurring", 160, y);

    y += 10;

    // Iterate over transactions and add them to the PDF
    transactions.forEach((transaction) => {
        doc.text(transaction.description, 10, y);
        doc.text(transaction.amount.toString(), 60, y);
        doc.text(transaction.type, 100, y);
        doc.text(transaction.category, 130, y);
        doc.text(transaction.isRecurring ? "Yes" : "No", 160, y);
        y += 10;
    });

    // Save the PDF
    doc.save("transactions.pdf");
}


// Add event listener for PDF export button
document.getElementById('export-pdf-btn').addEventListener('click', exportToPDF);

function exportToExcel() {
    const wb = XLSX.utils.book_new();

    // Add a column for isRecurring
    const ws_data = [["Description", "Amount", "Type", "Category", "Recurring"]];
    transactions.forEach((transaction) => {
        ws_data.push([
            transaction.description,
            transaction.amount,
            transaction.type,
            transaction.category,
            transaction.isRecurring ? "Yes" : "No"
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");

    // Export the workbook
    XLSX.writeFile(wb, "transactions.xlsx");
}


// Add event listener for Excel export button
document.getElementById('export-excel-btn').addEventListener('click', exportToExcel);


function importFromExcel(event) {
    const file = event.target.files[0];
    if (!file) {
        alert('Please select a file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert worksheet data to JSON
        const sheetData = XLSX.utils.sheet_to_json(worksheet);

        const newTransactions = sheetData.map(row => {
            return {
                description: row['Description'],
                amount: parseFloat(row['Amount']),
                type: row['Type'],
                category: row['Category'],
                isRecurring: row['Recurring'] === 'Yes',
                recurringInterval: row['RecurringInterval'] || null
            };
        });

        const validTransactions = newTransactions.filter(transaction =>
            transaction.description &&
            !isNaN(transaction.amount) &&
            ['income', 'expense'].includes(transaction.type)
        );

        if (validTransactions.length === 0) {
            throw new Error('No valid transactions found in the Excel file.');
        }

        transactions.push(...validTransactions);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        updateUI();

        showNotification('Successfully imported ' + validTransactions.length + ' transactions from Excel!', 'success');
        document.getElementById('excel-file').value = '';
    };

    reader.onerror = function () {
        showNotification('Error reading the Excel file. Please try again.', 'error');
    };

    reader.readAsArrayBuffer(file);
}

// Add event listener for Excel import button
document.getElementById('import-excel-btn').addEventListener('click', () => {
    document.getElementById('excel-file').click();
});
document.getElementById('excel-file').addEventListener('change', importFromExcel);


// Function to export transactions to JSON
function exportToJSON() {
    const jsonContent = JSON.stringify(transactions, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'transactions.json');
    a.click();

    showNotification('JSON exported successfully!', 'success');
}

// Function to import transactions from JSON
function importFromJSON(event) {
    const file = event.target.files[0];
    if (!file) {
        alert('Please select a JSON file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const jsonText = e.target.result;
            const importedTransactions = JSON.parse(jsonText);

            // Validate each transaction before adding it to the transactions array
            const validTransactions = importedTransactions.filter(transaction =>
                transaction &&
                typeof transaction.description === 'string' &&
                !isNaN(transaction.amount) &&
                ['income', 'expense'].includes(transaction.type) &&
                typeof transaction.category === 'string'
            );

            if (validTransactions.length === 0) {
                throw new Error('No valid transactions found in the JSON file.');
            }

            transactions.push(...validTransactions);
            localStorage.setItem('transactions', JSON.stringify(transactions));
            updateUI();

            showNotification(`Successfully imported ${validTransactions.length} transactions from JSON!`, 'success');
            document.getElementById('json-file').value = '';
        } catch (error) {
            console.error('Error importing JSON:', error);
            showNotification('Error importing JSON file. Please check the file format.', 'error');
        }
    };

    reader.onerror = function () {
        showNotification('Error reading the JSON file. Please try again.', 'error');
    };

    reader.readAsText(file);
}


// Add event listeners for JSON import/export buttons
document.getElementById('export-json-btn').addEventListener('click', exportToJSON);
document.getElementById('import-json-btn').addEventListener('click', () => {
    document.getElementById('json-file').click();
});
document.getElementById('json-file').addEventListener('change', importFromJSON);


// Add the notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', function () {
    // Initialize existing event listeners
    addTransactionBtn.addEventListener('click', addTransaction);
    categoryFilterEl.addEventListener('change', updateUI);
    recurringCheckbox.addEventListener('change', () => {
        recurringIntervalEl.disabled = !recurringCheckbox.checked;
    });

    // Add CSV import/export event listeners
    document.getElementById('import-csv-btn').addEventListener('click', function () {
        console.log('Import button clicked');
        document.getElementById('csv-file').click();
    });
    document.getElementById('csv-file').addEventListener('change', function (event) {
        console.log('File selected:', event.target.files[0]);
        importFromCSV(event);
    });
    document.getElementById('export-csv-btn').addEventListener('click', exportToCSV);

    deleteAllBtn.addEventListener('click', () => {
        const transactionEls = document.querySelectorAll('.transaction-item');
        const transactionLength = transactionEls.length;

        if (transactionLength === 0) return; // No transactions to delete

        // Remove each transaction with a delay for the slide animation
        transactionEls.forEach((transactionEl, index) => {
            setTimeout(() => {
                transactionEl.classList.add('deleting');
                setTimeout(() => {
                    transactionEl.remove();
                    // When the last transaction is removed, clear localStorage and update the UI
                    if (index === transactionLength - 1) {
                        transactions = [];
                        localStorage.setItem('transactions', JSON.stringify(transactions));
                        updateUI(); // Refresh the UI after all are removed
                    }
                }, 600);
            }, index * 200);
        });

        showNotification('All transactions deleted successfully', 'success');
    });

    // Initial UI update
    updateUI();
});

// Call processRecurringTransactions function every time the app loads
processRecurringTransactions();

window.onload = function () {
    // Clear all form fields on page load
    descriptionEl.value = '';
    amountEl.value = '';
    transactionTypeEl.value = 'income';
    categoryEl.value = 'Salary';
    recurringCheckbox.checked = false;
    recurringIntervalEl.disabled = true;
    recurringIntervalEl.value = 'daily';
};
