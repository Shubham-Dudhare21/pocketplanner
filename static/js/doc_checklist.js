// this is just to use as teh list item id for giving the lables
let counter = 0;

// the document code start from here
let doc_id = document.querySelector('#doc_id').value;
let main_container = document.getElementById('main');
main_container.innerHTML = `
        <div class="new_checklist_bar">
            <select name="checked_style" class="checked_style" id="checkedStyle">
                <option value="line-through" selected disabled>Checked Style</option>
                <option value="none">None</option>
                <option value="line-through">Line Through</option>
                <option value="underline">Underline</option>
                <option value="overline">Overline</option>
                <option value="line-through-double">Double Line Through</option>
                <option value="line-through-wavy">Wavy Line Through</option>
                <option value="line-through-dashed">Dashed Line Through</option>
            </select>
            <input autocomplete="off" type="text" name="checklist_title" id="checklistTitle" placeholder="Enter Checkist Title ....">
            <button type="button" class="add_new_checklist" id="addNewChecklist">Create</button>
        </div>
        <div class="checklist_container " id="checklistContainer"></div>
        <button type="button" class="center_checklists" id="centerChecklists">
            <i class='bx bx-exit-fullscreen'></i>
        </button>
    `;


// ------------------------------------------
// loading the data from app.py /document/checklist/id
fetch('/document/checklist/' + doc_id + '?fetch=FETCH')
    .then(response => response.json())
    .then(data => {
        if (!data) {
            throw new Error('No Response FROM Server')
        }
        data.forEach(checklist => {
            let content = JSON.parse(checklist["content"]);
            let checked = JSON.parse(checklist["checked"]);
            let checklist_items = document.createElement('ul');
            if (content.length != 0) {
                content.forEach((el, index) => {
                    let li = document.createElement('li');
                    li.innerHTML = `
                        <input type="checkbox" ${checked[index]? 'checked':''} value="${el}" id="index${counter}">
                        <label for="index${counter}" class="${checked[index]? 'active':''}">${el}</label>
                        `;
                    checklist_items.appendChild(li);
                    counter++;
                });
            }
            document.getElementById('checklistContainer').innerHTML += `
                <div class="checklist_window" style="top:${checklist["top"] || ' '}; left:${checklist["left"] || ' '};">
                    <div class="checklist_header">
                        <span class="checklist_title">${checklist["title"]}</span>
                        <button type="button" class="delete_checklist">
                            Delete
                        </button>
                    </div>
                    <ul class="checklist_items ${checklist["checked_style"]}">
                        ${checklist_items.innerHTML}
                    </ul>
                    <div class="add_to_checklist_container">
                        <input autocomplete="off" type="text" name="input_checklist_item" class="input_checklist_item">
                        <button type="button" class="add_checklist_item">
                        <i class='bx bx-list-plus'></i>
                        </button>
                    </div>
                </div>
                `;
        });

        // in the above the checked_toggle is not working so the following code is used
        document.querySelectorAll('.checklist_window').forEach(checklist => {
            checklist.querySelectorAll('input').forEach(el => {
                if (el.type === 'checkbox') {
                    el.addEventListener('change', () => {
                        if (el.checked) {
                            el.parentElement.querySelector('label').classList.add('active');
                        } else {
                            el.parentElement.querySelector('label').classList.remove('active');
                        }
                    });
                }
            });
        });

        // applying all the functions created
        document.querySelectorAll('.checklist_window').forEach(dragable);
        document.querySelectorAll('.checklist_window').forEach(delete_checklist);
        document.querySelectorAll('.add_checklist_item').forEach(add_checklist_item);
    });


// ---------------------------------------------
// creating new list with inputs from create checklist bar
let checklistContainer = document.getElementById('checklistContainer');
let checked_style = document.getElementById('checkedStyle');
let checklist_title = document.getElementById('checklistTitle');
document.getElementById('addNewChecklist').addEventListener('click', () => {
    let new_checklist = document.createElement('div');
    new_checklist.className = `checklist_window`;
    new_checklist.innerHTML = `
        <div class="checklist_header">
            <span class="checklist_title">${checklist_title.value || 'new checklist'}</span>
            <button type="button" class="delete_checklist">
                Delete
            </button>
        </div>
        <ul class="checklist_items ${checked_style.value}"></ul>
        <div class="add_to_checklist_container">
            <input autocomplete="off" type="text" name="input_checklist_item" class="input_checklist_item">
            <button type="button" class="add_checklist_item">
            <i class='bx bx-list-plus'></i>
            </button>
        </div>
        `;
    checklistContainer.appendChild(new_checklist);

    // focussing on new checklist
    checklistContainer.scrollLeft = 0;
    checklistContainer.scrollTop = 0;

    // applying all the functions created
    dragable(new_checklist);
    add_checklist_item(new_checklist.querySelector('.add_checklist_item'));
    delete_checklist(new_checklist);

    // clearing the create new fields
    checked_style.selectedIndex = 0;
    checklist_title.value = "";
});


// --------------------------------------
// dragable functionality for checklists window
function dragable (checklist_window) {
    let dragActive = false;
    let titleArea = checklist_window.querySelector('.checklist_title');

    // dragging functionality
    titleArea.addEventListener('mousedown', (e) => {
        dragActive = true;

        function move (e) {
            // return if the dragActive is false
            if (!dragActive) {
                return;
            }
            
            let all_styles = getComputedStyle(checklist_window);
            let top = parseInt(all_styles.top) || 0;
            let left = parseInt(all_styles.left) || 0;
            checklist_window.style.top = `${top + e.movementY}px`;
            checklist_window.style.left = `${left + e.movementX}px`;
        }

        function mouseup () {
            dragActive = false;
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', mouseup)
        }

        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', mouseup);

        e.preventDefault();
    });
}


// --------------------------------------
// deleting the list from checklist container
function delete_checklist (checklist) {
    checklist.querySelector('.delete_checklist').addEventListener('click', () => {
        document.querySelector('#checklistContainer').removeChild(checklist);
    });
}


// -------------------------------------
// Adding new element to checklist
function add_checklist_item (btn) {
    btn.addEventListener('click', (e) => {
        e.preventDefault;
        let input = btn.closest('.add_to_checklist_container').querySelector('.input_checklist_item');
        let li = document.createElement('li');
        li.innerHTML = `
            <input type="checkbox" value="${input.value}" id="index${counter}">
            <label for="index${counter}">${input.value}</label>
            `;
        counter++;
        btn.closest('.checklist_window').querySelector('ul').appendChild(li);
        // applying checked toggle
        checked_toggle(li);
        input.value = '';
    });
}


// ---------------------------------------
// save function to send data to app.py
function save_file() {
    let data = [];
    if (document.querySelectorAll('.checklist_window').length != 0) {
        document.querySelectorAll('.checklist_window').forEach(checklist => {
            // empty dict to store the data
            let data_element = {};

            // data to be sent
            let current_checklist = [];
            let current_checklist_values = [];
            let style_class = [...checklist.querySelector('ul').classList][1];
            checklist.querySelectorAll('input').forEach(el => {
                if (el.type === 'checkbox') {
                    current_checklist.push(el.value);
                    current_checklist_values.push(el.checked);
                }
            });
            // adding the data to data_element
            data_element['title'] = checklist.querySelector('.checklist_title').innerHTML;
            data_element['top'] = checklist.style.top || ' ';
            data_element['left'] = checklist.style.left || ' ';
            data_element['checked_style'] = style_class;
            data_element['content'] = JSON.stringify(current_checklist);
            data_element['checked'] = JSON.stringify(current_checklist_values);

            // pusshing the data to data
            data.push(data_element);
        });
    }
    let current_DateTime = new Date;
    // sending the data to app.py /document/checklist/id via post
    fetch('/document/checklist/' + doc_id, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({'data':data, 'time':current_DateTime.toLocaleString()})
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
    i.addEventListener('click', e => save_file());
});
document.querySelector('.save-close-file-btn').addEventListener('click', e => {
    save_file();
    exit_file();
});


// ---------------------------------------
// centering all checklists
document.querySelector('#centerChecklists').addEventListener('click', () => {
    let viewport_width = 20;
    document.querySelectorAll('.checklist_window').forEach(checklist => {
        checklist.style.top = '40%';
        checklist.style.left = `${viewport_width}px`;
        if (window.innerWidth < 992) {
            viewport_width += 200;
        } else {
            viewport_width +=250
        }
    });
});


// ---------------------------------------
// checked element add or remove active
function checked_toggle(li) {
    li.querySelector('input').addEventListener('change', () => {
        if (li.querySelector('input').checked) {
            li.querySelector('label').classList.add('active');
        } else {
            li.querySelector('label').classList.remove('active');
        }
    });
}