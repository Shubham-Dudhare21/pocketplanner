from cs50 import SQL
from datetime import datetime, timedelta
from flask import Flask, flash, jsonify, session, render_template, redirect, request, url_for
from flask_session import Session
from helpers import login_required, currency, update_session_expiration, username_creater, doctypes, currencies
import json
from werkzeug.security import check_password_hash, generate_password_hash
from authlib.integrations.flask_client import OAuth
import os
import secrets
import uuid


# Configure application
app = Flask(__name__)
app.secret_key = secrets.token_urlsafe(16)

# add you credentials file here for google oauth
with open('credentials/OAuth_credentials.json') as f:
    credentials = json.load(f)

oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id=credentials['web']['client_id'],
    client_secret=credentials['web']['client_secret'],
    access_token_url='https://accounts.google.com/o/oauth2/token',
    access_token_params=None,
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    authorize_params=None,
    api_base_url='https://www.googleapis.com/oauth2/v1/',
    client_kwargs={'scope': 'email profile'},
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration'
)

# Configure session to use filesystem (instead of signed cookies)
session_life = timedelta(days=3)
app.config["SESSION_PERMANENT"] = True
app.config["SESSION_TYPE"] = "filesystem"
app.config["PERMANENT_SESSION_LIFETIME"] = session_life
Session(app)


# Configure CS50 Library to use SQLite database
db = SQL("sqlite:///pocketplanner.db")

# the following sets the expiry of session to 3 days from last visit
# .before_request is an decorator in flask that always executes before each request in the app
@app.before_request
def before_request():
    update_session_expiration(session_life)

# the folowing function is to return the user profile data when required e.g. home page and edit page
def user_profile_returner(user_id):
    user_profile = db.execute("SELECT users.username, users.name, users.email, users.profile_pic FROM users WHERE users.user_id = ?", user_id)
    if len(user_profile) != 1:
        user_profile = {}
    if not user_profile[0]["profile_pic"] or user_profile[0]["profile_pic"] == "":
        user_profile[0]["profile_pic"] = "/static/img/default_user_pic.jpg"
    return user_profile[0]

# the following function is to return all the documents created by the user e.g. for home page and my documents
def user_documents_returner(user_id, limit):
    if limit is None:
        user_docs = db.execute("SELECT * FROM doc_metadata WHERE user_id = ? ORDER BY last_update", user_id)
    else:
        user_docs = db.execute("SELECT * FROM doc_metadata WHERE user_id = ? ORDER BY last_update DESC LIMIT ?", user_id, limit)
    if len(user_docs) == 0:
        user_docs = []
    return user_docs

def check_doctype(doctype):
    if not doctype or doctype == "":
        return False
    for dict in doctypes:
        if dict["type"] == doctype:
            if dict["available"] == False:
                return False
            return True
    return False

# ---------------------------------- FROM HERE STARTS THE APP FUNCTIONS --------------------------------------#

@app.route('/')
def index():
    # check if the user is loged in
    user_id = session.get("user_id")

    # redirect to intro page if user is not loged in
    if not user_id:
        return render_template("index.html")
    
    # check if user exists in database
    user = db.execute("SELECT * FROM users WHERE user_id = ?", user_id)
    if len(user) != 1:
        return render_template("index.html")
    
    # redirect to home if user is logged in
    return redirect("/home")


@app.route('/registration', methods=["GET", "POST"])
def registration():
    # clearing previous session before creating new
    session.clear()

    if request.method == "POST":
        # collecting data from registration form
        name = request.form.get("name").title()
        username = request.form.get("username").lower()
        email = request.form.get("email").lower()
        password = request.form.get("password")
        confirm = request.form.get("confirm")
        current_datetime = request.form.get("current_datetime")

        # checking if all fields are filled
        if not name or not username or not email or not password or not confirm:
            return redirect(url_for("registration", warning="Fill all the fields"))
        
        # Weak password detection
        if len(password) < 8:
            return redirect(url_for("registration", warning="Password must be at least 8 characters long"))
        
        # checking if passwords match
        if request.form.get("password") != request.form.get("confirm"):
            return redirect(url_for("registration", warning="Confirm Password!"))
        
        # checking if email exist in database meaning user is already registered
        if len(db.execute("SELECT * FROM users WHERE email = ?", request.form.get("email"))) != 0:
            return redirect(url_for("registration", warning="Already Registered Email! Login instead"))
        
        # checking if username is taken by anyone else
        if len(db.execute("SELECT * FROM users WHERE username = ?", request.form.get("username"))) != 0:
            return redirect(url_for("registration", warning="Username already taken!"))
        
        # checking if the data has sql-injection
        for item in (name, username, email, password, confirm):
            if '"' in item or "'" in item:
                return redirect(url_for("registration", warning="do not use qoutes in your inputs"))

        # add hashed password
        password = generate_password_hash(password)

        # adding user to database
        db.execute("INSERT INTO users(username, name, email, password_hash, created_at, last_login) VALUES(?,?,?,?,?,?)",
                   username, name, email, password, current_datetime, current_datetime)
        session["user_id"] = db.execute("SELECT user_id FROM users WHERE username = ?",
                                        username)[0]["user_id"]
        return redirect("/home")
    
    return render_template("registration.html")


@app.route('/login', methods=["GET", "POST"])
def login():
    # clearing previous session before creating new
    session.clear()

    if request.method == "POST":
        # redirecting user OAuth if the provider is google
        if request.form.get("provider") == "google":
            redirect_uri = url_for('authorize', _external=True)
            return oauth.google.authorize_redirect(redirect_uri)
        
        current_datetime = request.form.get("current_datetime")
        
        # getting the username and pasword to local variables
        username = request.form.get("username")
        password = request.form.get("password")
        
        # checking if username or password is empty
        if not username or not password:
            return redirect(url_for("login", warning="Fill both username and password"))
        
        # checking if the data has sql-injection
        for item in (username, password):
            if '"' in item or "'" in item:
                return redirect(url_for("login", warning="do not use qoutes in your inputs"))

        # checking if username exist in database
        user = db.execute("SELECT * FROM users WHERE username = ?", username)
        if len(user) != 1:
            return redirect(url_for("login", warning="Username does not exist"))
        
        # checking if password is correct
        if not check_password_hash(user[0]["password_hash"], password):
            return redirect(url_for("login", warning="Incorrect password"))
        
        # updating last login
        db.execute("UPDATE users SET last_login = ? WHERE user_id = ?",
                   current_datetime, user[0]["user_id"])
        session["user_id"] = user[0]["user_id"]
        return redirect("/home")
    
    return render_template("login.html")


@app.route('/authorize')
def authorize():
    token = google.authorize_access_token()
    user_info = google.get('userinfo', token=token)
    user_info = user_info.json()
    current_datetime = request.form.get("current_datetime")

    # checking if the user is already registered with this oauth id
    oauth_check = db.execute("SELECT * FROM users WHERE oauth_id = ?",
                             user_info['id'])
    if len(oauth_check) == 1:
        session["user_id"] = oauth_check[0]["user_id"]
        db.execute("UPDATE users SET last_login = ? WHERE user_id = ?",
                   current_datetime, oauth_check[0]["user_id"])
        return redirect("/home")
    
    # checking if the user is already registered with this email address but not Oauth
    # if the user is already registered with this email and password then update the oauth id
    email_check = db.execute("SELECT * FROM users WHERE email = ? AND password_hash IS NOT NULL",
                             user_info['email'])
    if len(email_check) == 1:
        db.execute("UPDATE users SET external_auth = 'GOOGLE', oauth_id = ?, profile_pic = ? WHERE user_id = ?",
                   user_info['id'], user_info['picture'], email_check[0]["user_id"])
                
        session["user_id"] = email_check[0]["user_id"]
        return redirect("/home")
    
    # verifying if the google sent pic link
    if 'picture' in user_info and user_info['picture']:
        profile_pic = user_info['picture']
    else:
        profile_pic = ""

    # creating unique username
    while True:
        username = username_creater(user_info['name'])
        if len(db.execute("SELECT * FROM users WHERE username = ?", username)) == 0:
            break
    
    # adding user to database
    db.execute("INSERT INTO users(username, name, email, external_auth, oauth_id, created_at, last_login, profile_pic) VALUES(?,?,?, 'GOOGLE', ?,?,?,?)",
               username, user_info['name'], user_info['email'], user_info['id'], current_datetime, current_datetime, profile_pic)
    
    # updating session and redirect to home
    session["user_id"] = db.execute("SELECT user_id FROM users WHERE oauth_id = ?", user_info['id'])[0]["user_id"]
    
    return redirect("/home")


@app.route('/home')
@login_required
def home():
    user_id = session.get("user_id")
    # using created functions at begining, to get the data to show on home page
    user_profile = user_profile_returner(user_id)
    user_docs = user_documents_returner(user_id, 10)
    return render_template("home.html", user_profile=user_profile, user_docs=user_docs)


@app.route('/change_password', methods=["GET", "POST"])
@login_required
def change_password():
    if request.method == "POST":
        # getting data from form
        old_password = request.form.get("old_password")
        new_password = request.form.get("new_password")
        confirm = request.form.get("confirm_password")
        
        # checking if all fields are filled
        if not old_password or not new_password or not confirm:
            return redirect(url_for("home", warning="Fill all the fields"))
        
        # Weak password detection
        if len(new_password) < 8:
            return redirect(url_for("home", warning="Password must be at least 8 characters long"))
        
        # checking for passwords confirmation
        if new_password != confirm:
            return redirect(url_for("home", warning="Confirm Password!"))
        
        # checking if old password is correct
        user_id = session.get("user_id")
        user_data = db.execute("SELECT * FROM users WHERE user_id = ?", user_id)
        if not check_password_hash(user_data[0]["password_hash"], old_password):
            return redirect(url_for("home", warning="Incorrect Password"))
        
        # updating password field in database(users table)
        db.execute("UPDATE users SET password_hash = ? WHERE user_id = ?",
                   generate_password_hash(new_password), user_id)
        return redirect("/home")
    
    return render_template("change_password.html")


@app.route('/change_profile', methods=["GET", "POST"])
@login_required
def change_profile():
    if request.method == "POST":
        n = request.form.get("n")
        u = request.form.get("u")
        name = request.form.get("new_name")
        username = request.form.get("new_username")
        
        # checking for sqlinjections
        for item in (username, name):
            if '"' in item or "'" in item:
                return redirect(url_for("home", warning="do not use quotes in your inputs"))
        
        # checking if username is available or not
        if len(db.execute("SELECT * FROM users WHERE username = ? AND user_id != ?",
                          username, session.get("user_id"))) != 0:
            return redirect(url_for("home", warning="Username Already Taken!"))

        if username == "":
            username = u
        
        if name == "" or name == None:
            name = n

        # adding the new name and username to database
        db.execute("UPDATE users SET name = ?, username = ? WHERE user_id = ?",
                   name.title(), username.lower(), session.get("user_id"))
        return redirect("/home")
    return render_template("change_profile.html", u=request.args.get("u"), n=request.args.get("n"))


@app.route('/create', methods=["GET", "POST"])
@login_required
def create():
    user_id = session.get("user_id")
    if request.method == "POST":
        # getting data from form
        title = request.form.get("title")
        doctype = request.form.get("doctype")
        currency = "None" if request.form.get("currency") == None else request.form.get("currency")
        tags = "" if not request.form.get("tags") else request.form.get("tags")
        description = "" if request.form.get("description") == None else request.form.get("description")
        current_datetime = request.form.get("current_datetime")
        
        # checking if title field is filled and if the doc of same name is already in database
        if not title:
            return redirect(url_for("create", Warning="Enter Title for your document"))
        title = title.capitalize()
        n = len(db.execute("SELECT * FROM doc_metadata WHERE user_id = ? AND (doc_title LIKE ? OR doc_title = ?)",
                           user_id,f"{title} (%", title))
        if n != 0:
            title += " (" + str(n) + ")"
        
        # generating unique doc_id
        doc_id = str(uuid.uuid4())
        while True:
            if len(db.execute("SELECT * FROM doc_metadata WHERE doc_id = ?", doc_id)) == 0:
                break
            else:
                doc_id = str(uuid.uuid4())

        # using tags_generator to create list of tags without spaces
        tags = tags.replace(" ", "")
        if tags == "" or tags == None:
            tags = "None"

        # checking for valid doctype
        if not check_doctype(doctype):
            doctype = "TEXT"
        
        # adding the data to database (creating doc)
        db.execute("INSERT INTO doc_metadata(doc_id, user_id, doc_title, doc_type, created_at, last_update, tags, desc, currency) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)",
                   doc_id, user_id, title.capitalize(), doctype, current_datetime, current_datetime, tags, description, currency)

        return redirect(f"/document/{doctype.lower()}/{str(doc_id)}")
    return render_template("create.html", doctypes=doctypes, currencies=currencies)


@app.route('/my_documents', methods=["GET", "POST"])
@login_required
def my_documents():
    documents = {}
    user_id = session.get("user_id")
    if request.method == "POST":
        # Group the results by first letter
        tags = []
        doctype = []
        sortby = request.form.get("sortby")
        groupby = request.form.get("groupby")
        order = request.form.get("order")
        # validating the above values
        if sortby not in ("doc_title", "last_update", "created_at"):
            sortby = "doc_title"
        if groupby not in ("tags", "doctype", "doc_title"):
            groupby = None
        if order not in ("ASC", "DESC"):
            order = "ASC"
        
        # if the user wants to group by tags collecting tags
        if groupby == "tags":
            temp = db.execute("SELECT tags FROM doc_metadata WHERE user_id = ?",
                              user_id)
            if len(temp) > 0:
                for i in temp:
                    words = i["tags"].split(",")
                    for word in words:
                        if word not in tags:
                            tags.append(word)
            tags.sort()
        # if the user wants to group by doctype collecting doctypes
        elif groupby == "doctype":
            temp = db.execute("SELECT doc_type FROM doc_metadata WHERE user_id = ?",
                              user_id)
            if len(temp) > 0:
                for i in temp:
                    if i["doc_type"] not in doctype:
                        doctype.append(i["doc_type"])
            doctype.sort()

        # if the user does not want to group returning all documents with sort and order
        if groupby == None:
            temp_documents = db.execute(f"SELECT * FROM doc_metadata WHERE user_id = ? ORDER BY {sortby} {order}",
                                        user_id)
            documents["All Documents"] = temp_documents
        # if the user wants to group by title's first letter, grouping and sorting by first letter
        elif groupby == "doc_title":
            temp_documents = db.execute(f"SELECT SUBSTR(doc_title, 1, 1) AS first_letter, * FROM doc_metadata WHERE user_id = ? ORDER BY first_letter, doc_title {order}",
                                        user_id)
            for row in temp_documents:
                first_letter = row['first_letter']
                if first_letter not in documents:
                    documents[first_letter] = []
                documents[first_letter].append(row)
        # if the user wants to group by doctype, grouping and sorting by doctype
        elif groupby == "doctype":
            for i in doctype:
                documents[i] = []
            temp_documents = db.execute(f"SELECT * FROM doc_metadata WHERE user_id = ? ORDER BY {sortby} {order}",
                                        user_id)
            for doc in temp_documents:
                documents[doc["doc_type"]].append(doc)
        # if the user wants to group by tags, grouping and sorting by tags
        else:
            for tag in tags:
                documents[tag] = []
            temp_documents = db.execute(f"SELECT * FROM doc_metadata WHERE user_id = ? ORDER BY {sortby} {order}",
                                        user_id)
            if len(temp_documents) > 0:
                for doc in temp_documents:
                    words = doc["tags"].split(",")
                    for word in words:
                        if word in tags:
                            documents[word].append(doc)

        return render_template("my_documents.html", documents=documents)
    documents["All Documents"] = db.execute("SELECT * FROM doc_metadata WHERE user_id = ? ORDER BY last_update DESC",
                                user_id)
    return render_template("my_documents.html", documents=documents)


@app.route('/delete/<doc_id>')
@login_required
def delete(doc_id):
    document = db.execute("SELECT * FROM doc_metadata WHERE doc_id = ?", doc_id)
    if len(document) != 1:
        return redirect("/my_documents")
    document = document[0]
    if document["user_id"] != session.get("user_id"):
        return redirect("/my_documents")
    if len(db.execute("SELECT * FROM ? WHERE doc_id = ?", document["doc_type"], doc_id)) != 0:
        db.execute("DELETE FROM ? WHERE doc_id = ?", document["doc_type"], doc_id)
    db.execute("DELETE FROM doc_metadata WHERE doc_id = ?", doc_id)
    return redirect("/my_documents")


@app.route('/logout')
@login_required
def logout():
    # Log user out
    session.clear()
    # redirect user to intro page
    return redirect("/")


# the following route is for the creation of the document editor page layout
@app.route('/document_layout')
@login_required
def document_layout():
    doc_id = request.args.get("doc_id")
    if not doc_id: 
        return jsonify({})
    user_id = session.get("user_id")
    layout = {}
    profile = (user_profile_returner(user_id))
    layout["profile_pic"] = profile["profile_pic"]
    layout["username"] = profile["username"]
    layout["name"] = profile["name"]
    document = db.execute("SELECT * FROM doc_metadata WHERE doc_id = ?", doc_id)
    if not document:
        return jsonify({})
    if len(document):
        name = ''
        for i in doctypes:
            if i["type"] == document[0]["doc_type"]:
                name = i["name"]
        layout["doc_name"] = name
        layout["desc"] = document[0]["desc"]
        layout["doc_title"] = document[0]["doc_title"]
        layout["doc_type"] = document[0]["doc_type"]
        layout["tags"] = document[0]["tags"]
        layout["created_at"] = document[0]["created_at"]
        layout["last_update"] = document[0]["last_update"]
        layout["currency"] = currency(document[0]["currency"])
    return jsonify(layout)


# --------------------- the following are the routes for the different types of documents ------------------- #
# text document creator
@app.route('/document/text/<doc_id>', methods=["GET", "POST"])
@login_required
def document_text(doc_id):
    # the following is to save the data from the document
    if request.method == "POST":
        save_request = request.get_json()
        if not save_request:
            return jsonify({'error': 'No Data Provided'}), 400
        for i in ('current_datetime', 'font_size', 'text_align'):
            if i not in save_request.keys() or not save_request[i]:
                return jsonify({'error': 'incomplete data'}), 400
        if 'content' not in save_request.keys():
            return jsonify({'error': 'incomplete data'}), 400
        
        # saving the save requests data in batabase
        db.execute("UPDATE text SET content = ?, font_size = ?, text_align = ? WHERE doc_id = ?",
                   save_request["content"], save_request["font_size"], save_request["text_align"], doc_id)
        db.execute("UPDATE doc_metadata SET last_update = ? WHERE doc_id = ?",
                   save_request["current_datetime"], doc_id)
        return jsonify({'status': 'Saved'}), 200
    
    # the following is the default route if the document is opening by get method
    fetch_request = request.args.get("fetch")
    if not fetch_request or fetch_request != "FETCH":
        return render_template("document_layout.html", doc_id=doc_id, cssfile="text.css", jsfile="doc_text.js")

    # the following is the route to fetch the data from the database
    # if request.args.get("fetch") == "FETCH": is the condition
    document = db.execute("SELECT * FROM text WHERE doc_id = ?", doc_id)
    if len(document) == 0:
        db.execute("INSERT INTO text(doc_id, content, font_size) VALUES(?, ?, ?)", doc_id, "", "14")
        document = db.execute("SELECT * FROM text WHERE doc_id = ?", doc_id)
        return jsonify(document[0])
    return jsonify(document[0])

# list document creator
@app.route('/document/list/<doc_id>', methods=["GET", "POST"])
@login_required
def document_list(doc_id):
    if request.method == "POST":
        time = request.get_json()["time"]
        save_request = request.get_json()["data"]
        if not request.get_json():
            return jsonify({'error': 'No Data Provided'}), 400
        # clearing the old data
        if len(db.execute("SELECT * FROM list WHERE doc_id = ?", doc_id)) != 0:
            db.execute("DELETE FROM list WHERE doc_id = ?", doc_id)
        # saving new data to the database
        if len(save_request) != 0:
            for list in save_request:
                db.execute("INSERT INTO list(doc_id, top, left, style_type, content, title) VALUES(?, ?, ?, ?, ?, ?)",
                           doc_id, list["top"], list["left"], list["style_type"], list["content"], list["title"])
        # updating the datetime for last_update in doc_metadata
        db.execute("UPDATE doc_metadata SET last_update = ? WHERE doc_id = ?",
                       time, doc_id)
        return jsonify({}), 200
    
    fetch_request = request.args.get("fetch")
    # the following is the default route if the document is opening by get method
    if not fetch_request or fetch_request != "FETCH":
        return render_template("document_layout.html", doc_id=doc_id, jsfile="doc_list.js", cssfile="list.css")

    # the following is the route to fetch the data from the database
    documents = db.execute("SELECT * FROM list WHERE doc_id = ?", doc_id)
    if len(documents) == 0:
        return jsonify([])
    return jsonify(documents)

@app.route('/document/checklist/<doc_id>', methods=["GET", "POST"])
@login_required
def document_checklist(doc_id):
    if request.method == "POST":
        time = request.get_json()["time"]
        request_data = request.get_json()["data"]
        if not request.get_json():
            return jsonify({'error': 'No Data Provided'}), 400
        # clearing the old data
        if len(db.execute("SELECT * FROM checklist WHERE doc_id = ?", doc_id)) != 0:
            db.execute("DELETE FROM checklist WHERE doc_id = ?", doc_id)
        # inserting the data to database
        if len(request_data) != 0:
            for i in request_data:
                db.execute("INSERT INTO checklist(doc_id, top, left, checked_style, content, checked, title) VALUES(?, ?, ?, ?, ?, ?, ?)",
                        doc_id, i["top"], i["left"], i["checked_style"], i["content"], i["checked"], i["title"])
        # updating the last update for document
        db.execute("UPDATE doc_metadata SET last_update = ? WHERE doc_id = ?",
                   time, doc_id)
        return jsonify({}), 200
    
    # default route for opening the checklist document
    fetch_request = request.args.get('fetch')
    if not fetch_request or fetch_request != "FETCH":
        return render_template("document_layout.html", doc_id=doc_id, cssfile="checklist.css", jsfile="doc_checklist.js")
    # route to fetch data from database
    documents = db.execute("SELECT * FROM checklist WHERE doc_id = ?", doc_id)
    return jsonify(documents)


@app.route('/document/budget_monthly_v1/<doc_id>', methods=["GET", "POST"])
@login_required
def document_budget_monthly_v1(doc_id):
    if request.method == "POST":
        request_data = request.get_json()
        if not request_data:
            return jsonify({'error': 'no data provided'}), 400
        if len(db.execute("SELECT * FROM budget_monthly_v1 WHERE doc_id = ?", doc_id)) != 0:
            db.execute("DELETE FROM budget_monthly_v1 WHERE doc_id = ?", doc_id)
        db.execute("INSERT INTO budget_monthly_v1(doc_id, users_name, month, year, categories, content) VALUES(?, ?, ?, ?, ?, ?)",
                   doc_id, request_data["users_name"], request_data["month"], request_data["year"], request_data["customCategories"], request_data["content"])
        db.execute("UPDATE doc_metadata SET last_update = ? WHERE doc_id = ?",
                   request_data["current_time"], doc_id)
        return jsonify({}), 200
    
    fetch_request = request.args.get('fetch')
    if not fetch_request or fetch_request != "FETCH":
        return render_template("document_layout.html", doc_id=doc_id, cssfile="budget_monthly_v1.css", jsfile="doc_budget_monthly_v1.js")
    
    document = db.execute("SELECT * FROM budget_monthly_v1 WHERE doc_id = ?", doc_id)
    if len(document) == 0:
        return jsonify({})
    return jsonify(document[0])


# ------------------------------------- API routes ---------------------------------------- #
# the following route always returns the gif link and description of the selected doctype in /create route
@app.route('/create_doctype')
def create_doctype():
    q = request.args.get("q")
    for current_selected in doctypes:
        if current_selected["type"] == q:
            return jsonify(current_selected)
    return jsonify({})


# The following route is to search documents with query by user. works in /my_document route
@app.route('/search_doc')
def search_doc():
    q = request.args.get("q-doc")
    result =db.execute("SELECT * FROM doc_metadata WHERE doc_title LIKE ? OR doc_type LIKE ? OR created_at LIKE ? OR last_update LIKE ? AND user_id = ?",
                       '%'+q+'%', '%'+q+'%', '%'+q+'%', '%'+q+'%', session.get("user_id"))
    return jsonify(result)


if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', use_reloader=True)
