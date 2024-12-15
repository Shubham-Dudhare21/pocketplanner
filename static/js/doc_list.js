let doc_id = document.querySelector('#doc_id').value;
let main_container = document.getElementById('main');
main_container.innerHTML = `
    <div class="new_list_bar">
        <select name="list_style" class="list_style" id="listStyle">
          <option value="disc" selected disabled>List Style</option>
          <option value="none">None</option>
          <option value="decimal">Numbers</option>
          <option value="disc">Disc</option>
          <option value="circle">Circle</option>
          <option value="square">Square</option>
          <option value="lower-alpha">Alphabates (Lower)</option>
          <option value="upper-alpha">Alphabates (Upper)</option>
          <option value="lower-roman">Roman (Lower)</option>
          <option value="upper-roman">Roman (Upper)</option>
        </select>

        <input autocomplete="off" type="text" name="list_title" id="listTitle" placeholder="Enter List Title ....">
        <button type="button" class="add_new_list" id="addNewList">Create</button>
    </div>
    <div class="list_container" id="listContainer"></div>
    <button type="button" class="center_lists" id="centerLists">
        <i class='bx bx-exit-fullscreen'></i>
    </button>
    `;


// ----------------------
// loading the data from app.py /document/list/id
fetch('/document/list/' + doc_id + '?fetch=FETCH')
  .then(response => response.json())
  .then(data => {
    if (!data) {
      throw new Error('No Response From Server')
    }
    data.forEach(list => {
      let content = list["content"];
      content = content.trim().split('\n');
      let list_items = ``;
      content.forEach(line => {
        list_items += `<li>${line}</li>`;
      });

      document.getElementById('listContainer').innerHTML += `
        <div class="list_window" style="top:${list["top"] || ' '}; left:${list["left"] || ' '};">
          <div class="list_header">
            <span class="list_title">${list["title"]}</span>
            <button type="button" class="delete_list">
              Delete
            </button>
          </div>
          <ul class="list_items" style="list-style-type:${list["style_type"]}">
            ${list_items}
          </ul>
          <div class="add_to_list_container">
            <input autocomplete="off" type="text" name="input_list_item" class="input_list_item">
            <button type="button" class="add_list_item">
              <i class='bx bx-list-plus'></i>
            </button>
          </div>
        </div>
        `;
      
    })
    // calling the delete list function
    delete_list();
    // calling the dragable function
    dragable_apply();
    // add list item function
    add_list_item();
  })


  // -----------------------------------------
// creating new list with inputs from create list bar
let listContainer = document.getElementById('listContainer');
let listStyle = document.getElementById('listStyle');
let listTitle = document.getElementById('listTitle');
document.getElementById('addNewList').addEventListener('click', () => {
    let new_list = `
        <div class="list_window">
          <div class="list_header">
            <span class="list_title">${listTitle.value || 'new list'}</span>
            <button type="button" class="delete_list">
              Delete
            </button>
          </div>
          <ul class="list_items" style="list-style-type:${listStyle.value}"></ul>
          <div class="add_to_list_container">
            <input autocomplete="off" type="text" name="input_list_item" class="input_list_item">
            <button type="button" class="add_list_item">
              <i class='bx bx-list-plus'></i>
            </button>
          </div>
        </div>
        `;
    listContainer.innerHTML += new_list;
    
    // foccusing the new list
    listContainer.scrollLeft = 0;
    listContainer.scrollTop = 0;
    // calling the delete list function
    delete_list();
    // calling the dragable function
    dragable_apply();
    // add list item function
    add_list_item();

    // clearing the fields
    listStyle.selectedIndex = 0;
    listTitle.value = "";
})

// ----------------------------------------------
// dragable functionality for lists window
function dragable(list_window) {
  // fucussing the selected list
  let dragActive = false;
  let titleArea = list_window.querySelector('.list_title');

  // dragging functionality
  titleArea.addEventListener('mousedown', (e) => {
    dragActive = true;

    function move (e) {
      // if the dragActive is false
      if (!dragActive) {
        return;
      }
      // if dragActive is true
      let all_styles = getComputedStyle(list_window);
      let top = parseInt(all_styles.top) || 0;
      let left = parseInt(all_styles.left) || 0;
      list_window.style.top = `${top + e.movementY}px`;
      list_window.style.left = `${left + e.movementX}px`;
    }

    function mouseup () {
      dragActive = false;
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', mouseup)
    }

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', mouseup);

    e.preventDefault();
  });
}

function dragable_apply() {
  const listWindows = document.querySelectorAll('.list_window');
  listWindows.forEach(dragable);
}

// -----------------------------------
// Deleting the list from list container
function delete_list() {
  document.querySelectorAll('.list_window').forEach(list => {
    list.querySelector('.delete_list').addEventListener('click', (e) => {
      document.querySelector('#listContainer').removeChild(list);
    });
  });
}

// --------------------------------------
// Adding new element to the list
function add_list_item() {
  document.querySelectorAll('.add_list_item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault;
      let input = btn.closest('.add_to_list_container').querySelector('.input_list_item');
      let li = document.createElement('li');
      li.innerHTML = input.value;
      btn.closest('.list_window').querySelector('ul').append(li);
      input.value = '';
    });
  });
}

// ---------------------------------------
// save function to send data via post to app.py
function save_file() {
  let data = [];
  if (document.querySelectorAll('.list_window').length != 0) {
    document.querySelectorAll('.list_window').forEach(list => {
      // empty dict to store data temporary
      let data_element = {};

      // data to be sent
      let current_list = "";

      list.querySelectorAll('li').forEach(li => {
        current_list += li.innerText + '\n';
      });
      // adding data to the data_element
      data_element['title'] = list.querySelector('.list_title').innerHTML;
      data_element['content'] = current_list;
      data_element['top'] = list.style.top || ' ';
      data_element['left'] = list.style.left || ' ';
      data_element['style_type'] = list.querySelector('ul').style.listStyleType;
      // pushing the data to the data list
      data.push(data_element);
    });
  }
  let current_DateTime = new Date;
  
  // sending the data to app.py /documnet/list/id via post
  fetch('/document/list/' + doc_id, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({'data':data, 'time':current_DateTime.toLocaleString()})
  })
  .then(response => {
    if(!response.ok) {
      throw new Error(`HTTP ERROR! status: ${response.status}`);
    }
    // reloading the doc metadata for updated datetime and other
    let titlebar_title = document.querySelector('.titlebar_title');
    if(titlebar_title) {
      load_document_layout(titlebar_title);
    }
    // if sucess then showing success message
    response_message('File saved successfully!', 'success_box');
    return response.json()
  })
  .catch(error => {
    console.error('Error Saving:', error)
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


// --------------------
// centering all the lists
document.querySelector('#centerLists').addEventListener('click', () => {
  let viewport_width = 20;
  document.querySelectorAll('.list_window').forEach(list => {
    list.style.top = '40%';
    list.style.left = `${viewport_width}px`;
    if (window.innerWidth < 992) {
      viewport_width += 200;
    } else {
      viewport_width +=250
    }
  })
});