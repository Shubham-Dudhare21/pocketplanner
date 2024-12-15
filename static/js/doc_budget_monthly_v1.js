let userCustomCategories = {
    'expense': [],
    'savings': [],
    'income': []
};

let total_income = 0.00;
let total_savings = 0.00;
let total_expense = 0.00;
let cash_balance = 0.00;


function formatCurrency(amount) {
    const formatted_amount = new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(amount));
    return currency_symbol + formatted_amount;
}

let doc_id = document.querySelector('#doc_id').value;
// ------------------------------------------------------
// loading the html content
document.getElementById('main').innerHTML = `
    <div class="budget_header">
        <div class="budget_options">
            <button id="dashboard-btn" class="active">Dashboard</button>
            <div></div>
            <button id="tracking-btn" class="">Budget Tracking</button>
            <div></div>
            <button id="settings-btn" class=""><i class='bx bx-cog'></i></button>
        </div>
    </div>
    
    <div class="budget_container">
        <div class="settings hidden" id="settings">
            <div class="insert_new_category" id="insertNewCategory">
            <select name="Category_type" id="categoryType">
                <option value="expense">Expenses</option>
                <option value="income">Income</option>
                <option value="savings">Savings</option>
            </select>
            <div></div>
            <input autocomplete="off" type="text" placeholder="Enter Category Name..." name="new_category_title" id="newCategoryTitle" class="new_category_title">
            <div></div>
            <button type="button" class="add_new_category" id="addNewCategory">
                <i class='bx bx-list-plus'></i>Add Category
            </button>
            </div>
            <h4>Categories</h4>
            <div class="categories_edit">
            <div>
                <h5>Expenses</h5>
                <ul id="expenseCategories"></ul>
            </div>
            <div>
                <h5>Savings</h5>
                <ul id="savingsCategories"></ul>
            </div>
            <div>
                <h5>Income</h5>
                <ul id="incomeCategories"></ul>
            </div>
            </div>
        </div>

        <div class="dashboard" id="dashboard">
            <div class="pie_chart">
                <canvas id="pieChart"></canvas>
            </div>
            <div class="summary_dashboard">
                <div class="monthly_income">
                    <h5>Monthly Income</h5>
                    <h3>$00,000</h3>
                </div>
                <div class="monthly_expense">
                    <h5>Monthly Expense</h5>
                    <h3>$00,000</h3>
                </div>
                <div class="monthly_savings">
                    <h5>Monthly Savings</h5>
                    <h3>$00,000</h3>
                </div>
                <div class="cash_balance">
                    <h5>Cash Balance</h5>
                    <h3>$00,000</h3>
                </div>
                <h4>Summary</h4>
            </div>
            <div class="bar_graph">
                <canvas id="barGraph"></canvas>
            </div>
        </div>

        <div class="tracking hidden" id="tracking">
            <div class="summary_tracking">
                <div class="income_total">
                    <h5>Income</h5>
                    <h3>$00,000</h3>
                </div>
                <div class="expense_total">
                    <h5>Expenses</h5>
                    <h3>$00,000</h3>
                </div>
                <div class="savings_total">
                    <h5>Savings</h5>
                    <h3>$00,000</h3>
                </div>
            </div>
            <div class="table_container">
                <table class="table table-hover">
                    <thead>
                    <tr>
                        <th scope="col">Date</th>
                        <th scope="col">Type</th>
                        <th scope="col">Category</th>
                        <th scope="col">Amount</th>
                        <th scope="col">Notes</th>
                        <th scope="col"></th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr class="track_new_data" id="trackNewData">
                        <td>
                        <input type="date" value="2022-01-01" name="date_selector" class="date_selector" id="dateSelector">
                        </td>
                        <td>
                        <select name="budget_type" class="budget_type" id="budgetType">
                            <option value="income">Income</option>
                            <option value="expense">Expenses</option>
                            <option value="savings">Savings</option>
                        </select>
                        </td>
                        <td>
                        <select name="category_selector" class="category_selector" id="categorySelector">
                        </select>
                        </td>
                        <td><input type="number" placeholder="Enter Amount" autocomplete="off" class="amount_input" id="amountInput" min="0"></td>
                        <td><input type="text" placeholder="Enter Notes" autocomplete="off" class="details_input" id="notesInput"></td>
                        <td class="add_new_track_btn"><button type="button" id="addNewTrack">Add Track</button></td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

      <div class="budget_footer">
        <div class="budget_name">
          <input type="text" value="name" class="edit_doc_name" id="editDocName" name="metadata_edit_name">
        </div>
        <div class="budget_month">
          <select name="month_selector" class="month_selector" id="monthSelector"></select>
          <select name="year_selector" class="year_selector" id="yearSelector"></select>
        </div>
      </div>
`;



// --------------------------------------
// function to add the months and years to the document
function monthYearSetter () {
    // setting the start and end year for years list
    let start = 2000;
    let end = new Date;

    let monthSelector = document.getElementById('monthSelector');
    let yearSelector = document.getElementById('yearSelector');

    // all months array
    let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    months.forEach((month, index) => {
        let option = document.createElement('option');
        option.value = index + 1;
        option.innerText = month;
        if (index == end.getMonth()) {
            option.selected = true;
        }
        monthSelector.appendChild(option);
    });

    end = end.getFullYear() + 1;
    for (let i = end; i >= start; i--) {
        let option = document.createElement('option');
        option.value = i;
        option.innerText = i;
        if (i == end - 1) {
            option.selected = true;
        }
        yearSelector.appendChild(option);
    }
}
monthYearSetter();

// --------------------------------------
// changing the ui of the document based on users selection
budgetOptions = document.querySelector('.budget_options').querySelectorAll('button');
budgetOptions.forEach(option => {
    option.addEventListener('click', () => {
        budgetOptions.forEach(option => {
            option.classList.remove('active');
        });
        option.classList.add('active');

        if (option.id == 'dashboard-btn') {
            document.getElementById('dashboard').classList.remove('hidden');
            document.getElementById('tracking').classList.add('hidden');
            document.getElementById('settings').classList.add('hidden');
        } else if (option.id == 'tracking-btn') {
            document.getElementById('dashboard').classList.add('hidden');
            document.getElementById('tracking').classList.remove('hidden');
            document.getElementById('settings').classList.add('hidden');
        } else {
            document.getElementById('dashboard').classList.add('hidden');
            document.getElementById('tracking').classList.add('hidden');
            document.getElementById('settings').classList.remove('hidden');
        }
    });
});


// ------------------------------------------------------
// function for adding the list of categories to the document
// let categorySelector = document.getElementById('');
function categoriesSetter (new_category, category_type) {
    let li = document.createElement('li');
    li.innerText = new_category;
    if (category_type == 'expense') {
        document.getElementById('expenseCategories').appendChild(li);
        return true;
    } else if (category_type == 'income') {
        document.getElementById('incomeCategories').appendChild(li);
        return true;
    } else if (category_type == 'savings') {
        document.getElementById('savingsCategories').appendChild(li);
        return true;
    }
    console.log('error in selected category type'.toUpperCase);
    return false;
}

// calling the function for the following lists
const income_categories = ['Salary', 'Freelance', 'Side Hustle', 'Gift', 'Rental Income', 'Other'];
const expense_categories = ['Rent/Mortage', 'Utilities (Electricity, Water, Gas)', "Internet/Phone/Cable", "Fuel", "Public Transit", "Vehicle Maintenance", "Insurance", "Groceries", "Dining Out", "Insurance", "Medical Bills/Prescriptions", "Gym/Wellness", "Credit Card Payments", "Loan Payments", "Clothing", "Entertainment/Subscriptions", "Personal Care", "Childcare", "School/College Fees", "Supplies", "Monthly Contributions", "Retirement Funds", "Gifts/Donations", "Pet Care", "Emergency"];
const savings_categories = ['Emergency Fund', 'Retirement Savings', 'Travel Fund', 'Education/Skill Development', 'Home Down Payment', 'Vehicle Purchase/Maintenance', 'Medical Savings', 'Debt Repayment Reserve', 'Investment Fund', 'Miscellaneous Goals'];

income_categories.forEach(category => {
    categoriesSetter(category, 'income');
});
expense_categories.forEach(category => {
    categoriesSetter(category, 'expense');
});
savings_categories.forEach(category => {
    categoriesSetter(category, 'savings');
});

// adding the users new category to the document
document.getElementById('addNewCategory').addEventListener('click', () => {
    let new_category = document.getElementById('newCategoryTitle').value;
    let category_type = document.getElementById('categoryType').value;
    if (new_category == '') {
        return;
    }
    let status = categoriesSetter(new_category, category_type);
    if (status) {
        userCustomCategories[category_type].push(new_category);
    }
    document.getElementById('newCategoryTitle').value = '';
});


// --------------------------------------------
// setting the budget tracking page [new track entry fields]
// setting the default date for the budget based on documents setted date
let month = document.getElementById('monthSelector').value;
let year = document.getElementById('yearSelector').value;
function dateSetter () {
    document.getElementById('dateSelector').value = `${year}-${month.toString().padStart(2, "0")}-01`;
}
dateSetter();
document.getElementById('monthSelector').addEventListener('change', () => {
    month = document.getElementById('monthSelector').value;
    dateSetter();
});
document.getElementById('yearSelector').addEventListener('change', () => {
    year = document.getElementById('yearSelector').value;
    dateSetter();
});

// showing the categories to the user based on their selection of type in budget tracking
function set_category_selector(type) {
    let categorySelector = document.getElementById('categorySelector');
    categorySelector.innerHTML = ``;
    if (type == 'income') {
        document.getElementById('incomeCategories').querySelectorAll('li').forEach(li => {
            let option = document.createElement('option');
            option.value = li.innerText;
            option.innerHTML = li.innerText;
            categorySelector.appendChild(option)
        });
    } else if (type == 'expense') {
        document.getElementById('expenseCategories').querySelectorAll('li').forEach(li => {
            let option = document.createElement('option');
            option.value = li.innerText;
            option.innerHTML = li.innerText;
            categorySelector.appendChild(option)
        });
    } else {
        document.getElementById('savingsCategories').querySelectorAll('li').forEach(li => {
            let option = document.createElement('option');
            option.value = li.innerText;
            option.innerHTML = li.innerText;
            categorySelector.appendChild(option)
        });
    }
}
set_category_selector('income');
let budget_type = document.getElementById('budgetType');
budget_type.addEventListener('change', () => {
    set_category_selector(budget_type.value);
});

// amount adder to the total
function amountAdder (input_amount, type) {
    let amount = parseFloat(input_amount);
    if (type == 'income') {
        total_income += amount;
        cash_balance = total_income - (total_expense + total_savings);
        return true;
    } else if (type == 'expense') {
        total_expense += amount;
        cash_balance = total_income - (total_expense + total_savings);
        return true;
    } else if (type == 'savings') {
        total_savings += amount;
        cash_balance = total_income - (total_expense + total_savings);
        return true
    }
    return false;
}

// updating the tracking summary
function updatesummary() {
    document.querySelector('.income_total').querySelector('h3').innerText = formatCurrency(total_income);
    document.querySelector('.monthly_income').querySelector('h3').innerText = formatCurrency(total_income);

    document.querySelector('.expense_total').querySelector('h3').innerText = formatCurrency(total_expense);
    document.querySelector('.monthly_expense').querySelector('h3').innerText = formatCurrency(total_expense);

    document.querySelector('.savings_total').querySelector('h3').innerText = formatCurrency(total_savings);
    document.querySelector('.monthly_savings').querySelector('h3').innerText = formatCurrency(total_savings);

    document.querySelector('.cash_balance').querySelector('h3').innerText = formatCurrency(cash_balance);

    if (cash_balance < 0) {
        document.querySelector('.income_total').classList.add('crossedLimit');
        document.querySelector('.monthly_income').classList.add('crossedLimit');
        document.querySelector('.cash_balance').classList.add('crossedLimit');
    } else {
        document.querySelector('.income_total').classList.remove('crossedLimit');
        document.querySelector('.monthly_income').classList.remove('crossedLimit');
        document.querySelector('.cash_balance').classList.remove('crossedLimit');
    }
    updateGraphs();
}

// adding the pie chart and the bar graph
let canvasPieChart = document.getElementById('pieChart').getContext('2d');
let doughnutChart = new Chart(canvasPieChart, {
    type: 'doughnut',
    data: {
        labels: ['Cash Balance', 'Expense', 'Savings'],
        datasets: [
            {
                data: [cash_balance, total_expense, total_savings],
                backgroundColor: [
                    '#202020',
                    '#636363',
                    '#b4b4b4'
                ],
                borderColor: [
                    '#e6e6e6'
                ]
            }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
    }
});

let canvasBarChart = document.getElementById('barGraph').getContext('2d');
let barGraph = new Chart(canvasBarChart, {
    type: 'bar',
    data: {
        labels: ['Income', 'Expense', 'Savings'],
        datasets: [
            {
                label: currency_symbol,
                data: [total_income, total_expense, total_savings],
                backgroundColor: [
                    '#202020',
                    '#636363',
                    '#b4b4b4'
                ],
            }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
    }
});

// function to update the pie chart and the bar graph
function updateGraphs() {
    doughnutChart.data.datasets[0].data = [cash_balance, total_expense, total_savings];
    barGraph.data.datasets[0].data = [total_income, total_expense, total_savings];
    doughnutChart.update();
    barGraph.update();
}

// removing the track entry from the table
function removeTrackEntry(TRow) {
    let btn = TRow.querySelector('button');
    btn.addEventListener('click', () => {
        let amount = parseFloat(TRow.querySelector('.row_amount').value);
        if (TRow.getAttribute('data-type-tr') == 'income') {
            total_income -= amount;
            cash_balance = total_income - (total_expense + total_savings);
        } else if (TRow.getAttribute('data-type-tr') == 'savings') {
            total_savings -= amount;
            cash_balance = total_income - (total_expense + total_savings);
        } else {
            total_expense -= amount;
            cash_balance = total_income - (total_expense + total_savings);
        }
        TRow.remove();
        updatesummary();
    });
}

// adding the new track entry to the table
document.getElementById('addNewTrack').addEventListener('click', () => {
    let input_date = document.getElementById('dateSelector');
    let input_type = document.getElementById('budgetType');
    let input_category = document.getElementById('categorySelector');
    let input_amount = document.getElementById('amountInput');
    let input_notes = document.getElementById('notesInput');

    if (input_date.value == '' || input_type.value == '' || input_category.value == '' || input_amount.value == '') {
        response_message('All Fields Are Required', 'warning_box');
        return;
    }
    if (!amountAdder(input_amount.value, input_type.value)) {
        response_message('Wrong Type', 'warning_box');
        return;
    }
    let date = new Date(input_date.value);
    date = date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })
    if (input_notes.value == '') {
        input_notes.value = 'None';
    }

    let TRow = document.createElement('tr');
    TRow.setAttribute("data-type-tr", input_type.value);
    TRow.innerHTML = `
        <td class="row_date">${date}</td>
        <td class="row_type">${input_type.value}</td>
        <td class="row_category">${input_category.value}</td>
        <td>
            ${formatCurrency(input_amount.value)}
            <input type="hidden" class="row_amount" value="${input_amount.value}">
        </td>
        <td class="notes"># ${input_notes.value}</td>
        <td class="remove_track_btn"><button type="button" class="removeTrack">Remove</button></td>
    `;
    document.querySelector('tbody').appendChild(TRow);
    input_amount.value = '';
    input_notes.value = '';
    removeTrackEntry(TRow);
    updatesummary();
});


// ----------------------------------------------------------------
// loading the file
fetch('/document/budget_monthly_v1//' + doc_id + '?fetch=FETCH')
    .then(response => response.json())
    .then(data => {
        if (!data) {
            throw new Error('No Response FROM Server');
        }
        if (Object.keys(data) != 0) {
            document.getElementById('editDocName').value = data["users_name"];
            document.getElementById('monthSelector').value = data["month"];
            document.getElementById('yearSelector').value = data["year"];
            // adding the users categories to the categories
            userCustomCategories = JSON.parse(data["categories"]);
            Object.keys(userCustomCategories).forEach(i => {
                userCustomCategories[i].forEach(category => {
                    let li = document.createElement('li');
                    li.innerText = category;
                    if (i == 'expense') {
                        document.getElementById('expenseCategories').appendChild(li);
                    } else if (i == 'income') {
                        document.getElementById('incomeCategories').appendChild(li);
                    } else {
                        document.getElementById('savingsCategories').appendChild(li);
                    }
                });
            });

            // adding the users data to table
            let content = JSON.parse(data["content"]);
            content.forEach(row => {
                let TRow = document.createElement('tr');
                TRow.setAttribute("data-type-tr", row["type"]);
                TRow.innerHTML = `
                    <td class="row_date">${row["date"]}</td>
                    <td class="row_type">${row["type"]}</td>
                    <td class="row_category">${row["category"]}</td>
                    <td>
                        ${formatCurrency(row["amount"])}
                        <input type="hidden" class="row_amount" value="${row["amount"]}">
                    </td>
                    <td class="notes">${row["notes"]}</td>
                    <td class="remove_track_btn"><button type="button" class="removeTrack">Remove</button></td>
                `;
                document.querySelector('tbody').appendChild(TRow);
                amountAdder(row["amount"], row["type"]);
                removeTrackEntry(TRow);
                updatesummary();
            });
        }
        // console.log(userCustomCategories);
    });


// -----------------------------------------------------------------
// saving the file function
function save_file() {
    let data = {};
    let current_datetime = new Date;
    data["users_name"] = document.getElementById('editDocName').value;
    data["month"] = document.getElementById('monthSelector').value;
    data["year"] = document.getElementById('yearSelector').value;
    data["customCategories"] = JSON.stringify(userCustomCategories);
    data["current_time"] = current_datetime.toLocaleString();
    content = [];
    document.querySelector('tbody').querySelectorAll('tr').forEach(row => {
        if (row.id == 'trackNewData') {
            return;
        }
        let dict = {};
        dict["date"] = row.querySelector('.row_date').innerText;
        dict["type"] = row.querySelector('.row_type').innerText;
        dict["category"] = row.querySelector('.row_category').innerText;
        dict["amount"] = row.querySelector('.row_amount').value;
        dict["notes"] = row.querySelector('.notes').innerText;
        content.push(dict);
    });
    data["content"] = JSON.stringify(content);

    fetch('/document/budget_monthly_v1//' + doc_id, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ERROR! status: ${response.status}`);
        }

        // reloading the document layout for updated datetime
        let titlebar_title = document.querySelector('.titlebar_title');
        if (titlebar_title) {
            load_document_layout(titlebar_title);
        }
        // if success the showing success msg
        response_message('File saved successfully!', 'success_box');
        return response.json()
    })
    .catch(error => {
        console.error('Error Saving', error)
    });
}


// calling the save file function
document.querySelectorAll('.save-file-btn').forEach( i => {
    i.addEventListener('click', () => save_file());
});
document.querySelector('.save-close-file-btn').addEventListener('click', () => {
    save_file();
    exit_file();
});
