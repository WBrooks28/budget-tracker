// create a variable to hold db connection
let db;

// establish connection to indexedDB database
const request = indexedDB.open('budget_tracker', 1);

// emit if the database version changes
request.onupgradeneeded = function(event) {
    // save reference to database
    const db = event.target.result

    db.createObjectStore('new_item', { autoIncrement: true });
};

// upon successful
request.onsuccess = function(event) {
    db = event.target.result;

    // check if app is online, run uploadBudget
    if (navigator.onLine) {
        uploadBudget();
    }
};

request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
};

// function to submit when there is no internet connection
function saveRecord(record) {
    const transaction = db.transaction(['new_item'], 'readwrite');

    const budgetObjectStore = transaction.objectStore('new_item');

    budgetObjectStore.add(record);
}

function uploadBudget() {
    // open transaction to db
    const transaction = db.transaction(['new_item'], 'readwrite');

    // access your object store
    const budgetObjectStore = transaction.objectStore('new_item');

    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll()

    getAll.onsuccess = function() {
        if(getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text.plain, */*',
                    'Content-Type': 'application/json',
                },
            })
            .then((response) => response.json())
            .then((serverResponse) => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                const transaction = db.transaction(['new_item'], 'readwrite');
                const budgetObjectStore = transaction.objectStore('new_item');

                budgetObjectStore.clear();
                alert('All saved budget items have been submitted!');
            })
            .catch((err) => {
                console.log(err);
            });
        }
    };
}

window.addEventListener('online', uploadBudget);