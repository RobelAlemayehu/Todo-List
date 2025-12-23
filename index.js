const saveBtn = document.getElementById("saveBtn")
const titleField = document.getElementById("titleField")
const descriptionField = document.getElementById("descriptionField")
const categoryField = document.getElementById("categoryField")
const dueDateField = document.getElementById("dueDateField")
const searchField = document.getElementById("searchField")
const categoryFilter = document.getElementById("categoryFilter")
const lists = document.getElementById("lists")
const completedCount = document.getElementById("completedCount")
const remainingCount = document.getElementById("remainingCount")

const API_URL = "http://localhost:3000/todos"
let todos = []
let editingId = null
let searchQuery = ""
let filterCategory = ""

// Modal elements
const modalOverlay = document.getElementById("modalOverlay")
const modalTitle = document.getElementById("modalTitle")
const modalMessage = document.getElementById("modalMessage")
const modalFooter = document.getElementById("modalFooter")

// Custom Alert Function
function showAlert(title, message, type = "info") {
    modalTitle.textContent = title
    modalMessage.textContent = message
    
    modalFooter.innerHTML = ""
    const okBtn = document.createElement("button")
    okBtn.className = "modal-btn modal-btn-primary"
    okBtn.textContent = "OK"
    okBtn.onclick = () => {
        modalOverlay.classList.remove("show")
    }
    modalFooter.appendChild(okBtn)
    
    modalOverlay.classList.add("show")
    
    // Close on overlay click
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove("show")
        }
    }
}

// Custom Confirm Function
function showConfirm(title, message) {
    return new Promise((resolve) => {
        modalTitle.textContent = title
        modalMessage.textContent = message
        
        modalFooter.innerHTML = ""
        
        const cancelBtn = document.createElement("button")
        cancelBtn.className = "modal-btn modal-btn-secondary"
        cancelBtn.textContent = "Cancel"
        cancelBtn.onclick = () => {
            modalOverlay.classList.remove("show")
            resolve(false)
        }
        
        const confirmBtn = document.createElement("button")
        confirmBtn.className = "modal-btn modal-btn-danger"
        confirmBtn.textContent = "Delete"
        confirmBtn.onclick = () => {
            modalOverlay.classList.remove("show")
            resolve(true)
        }
        
        modalFooter.appendChild(cancelBtn)
        modalFooter.appendChild(confirmBtn)
        
        modalOverlay.classList.add("show")
        
        // Close on overlay click
        modalOverlay.onclick = (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove("show")
                resolve(false)
            }
        }
    })
}

// Load todos on page load
loadTodos()

// Close modal on ESC key
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay.classList.contains("show")) {
        modalOverlay.classList.remove("show")
    }
})

// Event listeners
saveBtn.addEventListener("click", handleSave)
searchField.addEventListener("input", (e) => {
    searchQuery = e.target.value
    loadTodos() // Reload from server with search query
})
categoryFilter.addEventListener("change", (e) => {
    filterCategory = e.target.value
    loadTodos() // Reload from server with category filter
})

// Load todos from JSON Server
async function loadTodos() {
    try {
        let url = API_URL
        const params = new URLSearchParams()
        
        // Use server-side filtering for category
        if (filterCategory) {
            params.append("category", filterCategory)
        }
        
        // Use server-side search with ?q= parameter
        if (searchQuery) {
            params.append("q", searchQuery)
        }
        
        if (params.toString()) {
            url += "?" + params.toString()
        }
        
        const response = await fetch(url)
        if (!response.ok) throw new Error("Failed to load todos")
        todos = await response.json()
        renderList()
    } catch (error) {
        console.error("Error loading todos:", error)
        showAlert("Error", "Failed to load tasks. Make sure JSON Server is running on port 3000.")
    }
}

// Handle save (create or update)
async function handleSave() {
    const title = titleField.value.trim()
    const description = descriptionField.value.trim()
    const category = categoryField.value
    const dueDate = dueDateField.value

    if (!title) {
        showAlert("Validation Error", "Please enter a title")
        return
    }

    if (!category) {
        showAlert("Validation Error", "Please select a category")
        return
    }

    const todoData = {
        title,
        description,
        category,
        dueDate: dueDate || null,
        completed: false
    }

    try {
        if (editingId) {
            // Update existing todo
            const response = await fetch(`${API_URL}/${editingId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(todoData)
            })
            if (!response.ok) throw new Error("Failed to update todo")
        } else {
            // Create new todo
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(todoData)
            })
            if (!response.ok) throw new Error("Failed to create todo")
        }

        // Clear form
        titleField.value = ""
        descriptionField.value = ""
        categoryField.value = ""
        dueDateField.value = ""
        editingId = null
        saveBtn.textContent = "Save"

        // Reload todos
        await loadTodos()
    } catch (error) {
        console.error("Error saving todo:", error)
        showAlert("Error", "Failed to save task. Make sure JSON Server is running.")
    }
}

// Render todos list
function renderList() {
    lists.innerHTML = ""

    // Todos are already filtered by server-side search and category filter
    const filteredTodos = todos

    if (filteredTodos.length === 0) {
        lists.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 20px;">No tasks found</p>'
        updateStats()
        return
    }

    filteredTodos.forEach((todo) => {
        const wrapper = document.createElement("div")
        wrapper.className = `todo-item ${todo.completed ? "is-complete" : ""}`

        const header = document.createElement("div")
        header.className = "todo-item-header"

        const content = document.createElement("div")
        content.className = "todo-content"

        const title = document.createElement("p")
        title.className = "todo-title"
        title.textContent = todo.title

        const description = document.createElement("p")
        description.className = "todo-description"
        description.textContent = todo.description || "No description"

        const meta = document.createElement("div")
        meta.className = "todo-meta"

        const category = document.createElement("span")
        category.className = "todo-category"
        category.textContent = todo.category.charAt(0).toUpperCase() + todo.category.slice(1)

        if (todo.dueDate) {
            const dueDate = document.createElement("span")
            dueDate.className = "todo-due-date"
            const date = new Date(todo.dueDate)
            dueDate.innerHTML = `<i class="fa-solid fa-calendar"></i> ${date.toLocaleDateString()}`
            meta.appendChild(dueDate)
        }

        meta.appendChild(category)

        content.appendChild(title)
        content.appendChild(description)
        content.appendChild(meta)

        const actions = document.createElement("div")
        actions.className = "todo-actions"

        const markBtn = document.createElement("button")
        markBtn.className = "mark-btn"
        markBtn.textContent = todo.completed ? "Mark as incomplete" : "Mark as complete"
        markBtn.onclick = () => toggleComplete(todo.id)

        const editBtn = document.createElement("button")
        editBtn.className = "edit-btn"
        editBtn.innerHTML = `<i class="fa-solid fa-edit"></i> Edit`
        editBtn.onclick = () => editTodo(todo)

        const delBtn = document.createElement("button")
        delBtn.className = "delete-btn"
        delBtn.innerHTML = `<i class="fa-solid fa-trash"></i>`
        delBtn.onclick = () => deleteTodo(todo.id)

        actions.appendChild(markBtn)
        actions.appendChild(editBtn)
        actions.appendChild(delBtn)

        header.appendChild(content)
        header.appendChild(actions)
        wrapper.appendChild(header)
        lists.appendChild(wrapper)
    })

    updateStats()
}

// Toggle complete status
async function toggleComplete(id) {
    const todo = todos.find(t => t.id === id)
    if (!todo) return

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ completed: !todo.completed })
        })
        if (!response.ok) throw new Error("Failed to update todo")
        await loadTodos()
    } catch (error) {
        console.error("Error updating todo:", error)
        showAlert("Error", "Failed to update task.")
    }
}

// Edit todo
function editTodo(todo) {
    titleField.value = todo.title
    descriptionField.value = todo.description || ""
    categoryField.value = todo.category
    dueDateField.value = todo.dueDate || ""
    editingId = todo.id
    saveBtn.textContent = "Update"
    
    // Scroll to form
    titleField.scrollIntoView({ behavior: "smooth", block: "center" })
    titleField.focus()
}

// Delete todo
async function deleteTodo(id) {
    const confirmed = await showConfirm("Delete Task", "Are you sure you want to delete this task?")
    if (!confirmed) return

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        })
        if (!response.ok) throw new Error("Failed to delete todo")
        await loadTodos()
    } catch (error) {
        console.error("Error deleting todo:", error)
        showAlert("Error", "Failed to delete task.")
    }
}

// Update statistics
function updateStats() {
    const totalCompleted = todos.filter((todo) => todo.completed).length
    completedCount.textContent = totalCompleted
    remainingCount.textContent = todos.length - totalCompleted
}
