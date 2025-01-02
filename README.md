# pocketplanner
#### Video Demo: <>
#### App link: <https://pocketplanner.pythonanywhere.com>
#### Description:
PocketPlanner is a simple and intuitive web app for managing notes, tasks, and budgets. With features like sticky pad-style checklists and monthly budget tracking, it helps users stay organized and in control of their finances, it's perfect for personal productivity.

**Login**
When users visit the site, they can either sign up for a new account or log in using their credentials. Google authentication is also available for quick and secure account creation.
**Homepage**
After logging in, the homepage displays the user’s profile at the top, allowing them to update their username, name, and password. Below this, users can see their 10 most recent documents. Clicking on any document opens it instantly for editing.
**My Documents Page**
The 'My Documents' page provides a complete list of all documents. It includes a search bar and filter options to sort and group documents by different criteria. Users can preview descriptions or delete documents with a single click.
**Create New Page**
On the 'Create New' page, users can create four types of documents for now. The form on the right side allows users to input a title, select a file type, add tags, and write a description. If the budget document type is selected, they can also choose a currency. The left side provides a preview of the selected document type.
**Document Types Currently Available.**
* Plain Text File
* List File
* Checklist File
* Monthly Budget File V1
* Yearly Budget (Currently Unvailable)

1. **Text Documents:** These are simple, unformatted, text-only files. Users can increase or decrease the font size for the entire text and align the text to the left, right, or center.
2. **Checklists:** Has a top bar to create new checklists with checked styles selection and list titles. The checklists behave like sticky pads that can be moved on the canvas. Users can add to the checklist using an input field inside the checklist and delete the entire list using a button near the checklist title. List documents are similar to this but with list styles and without checkboxes.
3. **Monthly Budget:** A template designed for tracking income, expenses, and savings. The dashboard displays totals and visual summaries using bar graphs and doughnut charts. before starting set the date down there. The budget tracking page lets users add entries with fields for date, type (income, expense, savings), category, amount, and notes. Entries can be added or removed at any time. dashboard updates with change in tracking page. Users can also create custom categories for better organization.


> [!IMPORTANT]
> \# Before running the app <br/>
> pip install -r requirements.txt
>
> \# To Run the app<br/>
> flask run

#### Built With
* PYTHON - Programming Language
* FLASK - Web Framework
* HTML - Markup Language
* SCSS - Sassy CSS - rendered as CSS with SASS filename
* JAVASCRIPT - Programming Language for Web
* SQLITE3 - Query Language For Database
* CS50 - CS50's Python Library

#### Project Files
1. **Static folder** :
   >used to store folders with static files such as:
   > **css folder** : has stylesheets for styling the webpage. here both SCSS files and rendered CSS files are stored.<br/>
   > **img folder** : this folder contains image files such as logos and default profile pic.<br/>
   > **intro_page folder** : separate css and image files for intro page.<br/>
   > **js folder** : this folder contains javascript files for client side logic. main.js is js file i.e. attached to all the html documents and other js files are for specific document type selected by users and change dynamicaly with jinja and python.<br/>
   > **previews folder** : this folder contains all the gifs used for previewing the documents.<br/>
2. **templates folder** :
   > this folder has all the HTML files in the project.<br/>
3. **app.py** :
   >this is main application file. this file has all the routes and functions in the webapp such as :<br/>
   >index : for intro page<br/>
   >registration, login and authorize : for account creation or log in.<br/>
   >home, change_password, change_profile : for rendering homepage and its features.<br/>
   >create : this renders create page with form. when form is submmited stores it in database then redirect user to document created with formdata.<br/>
   >my_documents : this renders list of all the documents created by user and if filter is applied then returns the filtered data.<br/>
   >delete : deletes the documents data and metadata related to doc_id<br/>
   >document_layout : this renders the structure for all the documents.<br/>
   > the following are routes for documents mentioned above : document_text, document_list, document_checklist, document_budget_monthly_v1<br/>
   >there are few api routes such as : create_doctype and search_doc<br/>
4. **helpers.py** :
   > this file contains functions needed for the app.py to work.<br/>
5. **pocketplanner.db** :
   > database file. to store documents created by users and users data.<br/>
6. **requirement.txt** :
   > list of all the requirements needed to install before running the app.<br/>

#### Author of the Project: [Shubham Dudhare](https://github.com/Shubham-Dudhare21/)
#### License: [Click Here](https://github.com/Shubham-Dudhare21/pocketplanner/blob/main/LICENSE)
