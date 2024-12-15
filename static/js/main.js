// for budget files only
let currency_symbol = '';

// the following is for the doc type dropdown in create.html
// this will change the doc preview gif and description if the option is selected to the data from app.py route
let doctype = document.querySelector("#doctype-select");
if (doctype) {
    doctype.addEventListener('change', async function() {
        let current_selected = await doctype.value;
        let selected_data = await fetch('/create_doctype?q=' + current_selected)
            .then(response => response.json())
            .catch(error => {
                console.error('Error:', error);
                return {};
            });
        document.getElementById('doctype-desc').innerText = selected_data['desc'];
        document.getElementById('doc_preview').src = selected_data['src'];
        if (selected_data['currency'] == 'show') {
            document.getElementById('hide_currency').removeAttribute('hidden');
        } else {
            document.getElementById('hide_currency').setAttribute('hidden', true);
        }
    });
}


// updates the time every 5 seconds when creating the document
function update_current_DateTime(d) {
    let DateTime = new Date();
    d.value = DateTime.toLocaleString();
}
// for #current_datetime
let current_DateTime = document.getElementById('current_datetime');
if (current_DateTime) {
    update_current_DateTime(current_DateTime);
    setInterval(() => update_current_DateTime(current_DateTime), 1000);
}
// for #auth_datetime
let auth_DateTime = document.getElementById('auth_datetime');
if (auth_DateTime) {
    update_current_DateTime(auth_DateTime);
    setInterval(() => update_current_DateTime(auth_DateTime), 5000);
}


// the following is for the document section of the webapp
// to fetch the documents created by the user and sort, group them
function search_function(q) {
    let value = q.value
    let response = fetch('/search_doc?q-doc=' + value)
        .then(response => response.json())
        .catch(error => {
            console.error('Error:', error);
            return {};
        });
    TBody = document.querySelector('tbody');
    TBody.innerHTML = '';
    response.then((docs) =>
        docs.forEach((doc, index) => {
            let row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <button type="button" class="btn" data-bs-toggle="modal" data-bs-target="#pop_desc${index}">
                        <i class='bx bx-chevron-right'></i>
                    </button>
                    ${doc.doc_title}
                </td>
                <td>${doc.doc_type}</td>
                <td>${doc.last_update}</td>
                <td>${doc.created_at}</td>
                <td class="documents_buttons">
                    <form action="/document/${doc.doc_type.toLowerCase()}/${doc.doc_id}">
                        <button type="submit" class="btn btn-outline-success">Open</button>
                    </form>
                    
                    <form action="/delete/${doc.doc_id}">
                        <button type="submit" class="btn btn-outline-danger">
                            <i class='bx bx-trash' ></i>
                        </button>
                    </form>
                </td>

                <div class="modal fade" id="pop_desc${index}" tabindex="-1" aria-labelledby="pop_desc_label${index}" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="pop_desc_label${index}">
                                    ${doc.doc_title}
                                </h5>
                                <button 
                                    type="button" 
                                    class="btn-close" 
                                    data-bs-dismiss="modal" 
                                    aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <p>${doc.desc}</p>
                            </div>
                        </div>
                    </div>
                </div>
                `;
            document.querySelector('tbody').appendChild(row);
        })
    )}
let search_doc = document.getElementById('doc_search');
if (search_doc) {
    search_doc.addEventListener('input', async () => {
        await search_function(search_doc)
    });
}


// the following is for document layout---------------------------------------
// this is for titlebar options dropdown
function dropdown(trigger, menu_opt_class, trigger_class) {
    trigger.addEventListener('click', () => {
        let menu = document.querySelector(menu_opt_class);
        if (menu.classList.contains('hidden')) {
            menu.classList.remove('hidden');
        } else {
            menu.classList.add('hidden');
        }
        document.addEventListener('click', (e) => {
            if (!menu.classList.contains('.hidden') && !menu.contains(e.target) && !e.target.closest(trigger_class)) {
                menu.classList.add('hidden');
            }
        })
    })
}
// titlebar dropdowns
let file_dropdown_trigger = document.querySelector('.titlebar_file_container');
if (file_dropdown_trigger) {
    dropdown(file_dropdown_trigger, '.file_options', '.titlebar_file_container');
}
let edit_dropdown_trigger = document.querySelector('.titlebar_edit_container');
if (edit_dropdown_trigger) {
    dropdown(edit_dropdown_trigger, '.edit_options', '.titlebar_edit_container');
}


// the following is to fetch the layout data from the '/document_layout' path
function load_document_layout (titlebar_title) {
    let doc_id = document.querySelector('#doc_id').value;
    fetch('/document_layout?doc_id=' + doc_id)
        .then(response => response.json())
        .then(layout => {
            if (Object.keys(layout).length === 0) {
                window.location.href = '/home?warning=Document+not+found';
            }
            if (!titlebar_title.innerHTML.includes(layout.doc_title)) {
                titlebar_title.innerHTML += layout.doc_title;
            }
            document.querySelector('.offcanvas_doc_desc').innerHTML += layout.desc;

            if (layout.profile_pic == "") {
                layout.profile_pic = "/static/img/default_user_pic.jpg"
            }
            document.querySelector('#offcanvas_profile_img').src = layout.profile_pic;
            document.querySelector('.offcanvas_profile_text').innerHTML = `
                    <span id="users_name">${layout.name}</span>
                    <span>@${layout.username}</span>
                    `;
            document.querySelector('.offcanvas_extra_info').innerHTML = `
                <ul>
                    <li><span class="opt">Title</span>${layout.doc_title}</li>
                    <li><span class="opt">Type</span>${layout.doc_name}</li>
                    <li><span class="opt">Date Updated</span>${layout.last_update}</li>
                    <li><span class="opt">Date Created</span>${layout.created_at}</li>
                    <li><span class="opt">Tags</span>${layout.tags}</li>
                </ul>`;
            currency_symbol = layout.currency;
        })
        .catch(error => {
            console.error('Error:', error);
            window.location.href = '/my_documents?warning=Document+not+found';
        });
}

let titlebar_title = document.querySelector('.titlebar_title');
if (titlebar_title) {
    load_document_layout(titlebar_title);
}


// the following is for the tab and backspace functionalities as notepad
function tab_functionality(text_field) {
    let input = document.querySelectorAll(text_field);
    input.forEach(i => {
        i.addEventListener('keydown', e => {
            if(e.key == 'Tab') {
                e.preventDefault();
                i.value += '    ';
            }else if (e.key == 'Backspace' && /\s{4}$/.test(i.value)) {
                e.preventDefault();
                i.value = i.value.slice(0, -4);
            }
        })
    })
}

// for the full maximize and chrome window
function fullscreenToggle() {
    if (!document.fullscreenElement &&    // Check if not already fullscreen
        !document.mozFullScreenElement && // For Firefox
        !document.webkitFullscreenElement && // For Chrome, Safari, Opera
        !document.msFullscreenElement) { // For IE/Edge
        // Enter fullscreen mode
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        }
    } else {
        // Exit fullscreen mode
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

// exit file function
function exit_file() {
    window.location.href = '/my_documents';
}


// adding the warning or message to the the document
// message_class are .success_box or .warning box
function response_message (message, message_class) {
    let message_container = document.getElementById('message');
    if (message_container.classList.length > 0) {
        message_container.className = '';
    }
    message_container.classList.add(message_class);
    message_container.innerHTML = message;
    setTimeout(() => {
        message_container.className = '';
        message_container.innerHTML = '';
    }, 5000);
}

