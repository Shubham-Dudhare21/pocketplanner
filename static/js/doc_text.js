// adding the html to the document_layout.html
document.getElementById('main').innerHTML = `
    <div id="text-document">
        <div class="toolbar-text">
            <div class="fontsize">
            Font Size <input type="number" id="fontSize" value="16" min="10" max="100">
            </div>
            <div class="text_align">
                Text Align
                <button class="textalign" data-align="left">
                    <i class='bx bx-align-left'></i>
                </button>
                <button class="textalign" data-align="center">
                    <i class='bx bx-align-middle' ></i>
                </button>
                <button class="textalign" data-align="right">
                    <i class='bx bx-align-right' ></i>
                </button>
                <button disabled class="textalign">
                    <i class='bx bx-align-justify'></i>
                </button>
            </div>
        </div>
        <textarea name="content-text" id="content-text" autofocus></textarea>
    </div>
    `;


// data from text document
let textarea = document.getElementById('content-text');
let doc_id = document.getElementById('doc_id').value;
// LOAD DATA FROM DATABASE(with app.py) TO HTML
fetch('/document/text/' + doc_id + '?fetch=FETCH')
    .then(response => response.json())
    .then(data => {
        textarea.value = data.content;
        textarea.style.fontSize = data.font_size + 'px';
        document.querySelector('#fontSize').value = data.font_size;
        textarea.style.textAlign = data.text_align;
    })
    .catch(error => {
        response_message('Something Went Wrong! Try Again', 'warning_box')
        console.log(error);
        return {};
    });

// save file function -----------------------
function save_file() {
    data = {}
    let current_datetime = new Date;
    data["current_datetime"] = current_datetime.toLocaleString();
    data["content"] = textarea.value;
    data["font_size"] = window.getComputedStyle(textarea).fontSize.replace('px', '');
    data["text_align"] = window.getComputedStyle(textarea).textAlign;
    
    // sending the data to server via post
    fetch('/document/text/' + doc_id, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status ${responce.status}`)
        }
        let titlebar_title = document.querySelector('.titlebar_title');
        if (titlebar_title) {
            // the following is to fetch the layout data from the '/document_layout' path
            // to update the document layout (eg: last update datetime)
            load_document_layout(titlebar_title);
        }
        response_message('File saved successfully!', 'success_box');
        return response.json()
    })
    .catch(error => {
        console.error('Error Saving:', error);
    })
}

// calling the save file function
document.querySelectorAll('.save-file-btn').forEach( i => {
    i.addEventListener('click', e => save_file());
});
document.querySelector('.save-close-file-btn').addEventListener('click', e => {
    save_file();
    exit_file();
});

// tab and backspace functionality -- the function is defined in the main.js
tab_functionality('#content-text');


// font size functionality
document.querySelector('#fontSize').addEventListener('input', e => {
    textarea.style.fontSize = document.querySelector('#fontSize').value + 'px';
});


// text align functionalty
let align_buttons = document.querySelectorAll('.textalign')
align_buttons.forEach(button => {
    button.addEventListener('click', function () {
        if (!button.classList.contains('active')) {
            align_buttons.forEach(b => {
                if (b.classList.contains('active')){
                    b.classList.remove('active');
                }
            });
            button.classList.add('active');
            textarea.style.textAlign = button.getAttribute('data-align');
        }
    });
});