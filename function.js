document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const taskForm = document.getElementById('task-form');
            const taskInput = document.getElementById('task-input');
            const prioritySelect = document.getElementById('priority-select');
            const taskList = document.getElementById('task-list');
            const noTasks = document.getElementById('no-tasks');
            const taskCount = document.getElementById('task-count');
            const totalCount = document.getElementById('total-count');
            const completedCount = document.getElementById('completed-count');
            const clearCompletedBtn = document.getElementById('clear-completed');
            const filterAllBtn = document.getElementById('filter-all');
            const filterActiveBtn = document.getElementById('filter-active');
            const filterCompletedBtn = document.getElementById('filter-completed');

            // State
            let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            let currentFilter = 'all';

            // Initialize
            renderTasks();
            updateStats();

            // Event Listeners
            taskForm.addEventListener('submit', addTask);
            clearCompletedBtn.addEventListener('click', clearCompletedTasks);
            filterAllBtn.addEventListener('click', () => setFilter('all'));
            filterActiveBtn.addEventListener('click', () => setFilter('active'));
            filterCompletedBtn.addEventListener('click', () => setFilter('completed'));

            // Functions
            function addTask(e) {
                e.preventDefault();
                
                const text = taskInput.value.trim();
                if (!text) return;
                
                const newTask = {
                    id: Date.now(),
                    text,
                    completed: false,
                    priority: prioritySelect.value,
                    createdAt: new Date().toISOString()
                };
                
                tasks.unshift(newTask);
                saveTasks();
                renderTasks();
                updateStats();
                
                taskInput.value = '';
                taskInput.focus();
            }

            function renderTasks() {
                // Filter tasks based on current filter
                let filteredTasks = [];
                
                if (currentFilter === 'all') {
                    filteredTasks = tasks;
                } else if (currentFilter === 'active') {
                    filteredTasks = tasks.filter(task => !task.completed);
                } else if (currentFilter === 'completed') {
                    filteredTasks = tasks.filter(task => task.completed);
                }
                
                if (filteredTasks.length === 0) {
                    noTasks.style.display = 'block';
                    taskList.innerHTML = '';
                } else {
                    noTasks.style.display = 'none';
                    
                    // Sort tasks: completed at bottom, then by priority (high to low), then by creation date
                    filteredTasks.sort((a, b) => {
                        if (a.completed !== b.completed) {
                            return a.completed ? 1 : -1;
                        }
                        
                        const priorityOrder = { high: 3, medium: 2, low: 1 };
                        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                            return priorityOrder[b.priority] - priorityOrder[a.priority];
                        }
                        
                        return new Date(a.createdAt) - new Date(b.createdAt);
                    });
                    
                    taskList.innerHTML = filteredTasks.map(task => `
                        <div 
                            id="task-${task.id}" 
                            class="task-item p-4 sm:p-5 border-b border-gray-200 border-opacity-50 flex items-center justify-between hover:bg-white hover:bg-opacity-30 transition-colors duration-150 priority-${task.priority} ${task.completed ? 'completed' : ''}"
                            draggable="true"
                            data-id="${task.id}"
                        >
                            <div class="flex items-center max-w-[70%] sm:max-w-[80%]">
                                <button 
                                    class="complete-btn mr-3 sm:mr-4 w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 ${task.completed ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-indigo-300'} flex items-center justify-center hover:border-indigo-500 transition-colors"
                                    data-id="${task.id}"
                                >
                                    ${task.completed ? '<i class="fas fa-check text-xs"></i>' : ''}
                                </button>
                                <span class="task-text ${task.completed ? 'text-indigo-400' : 'text-indigo-800'} text-sm sm:text-base truncate">${task.text}</span>
                            </div>
                            <div class="flex items-center task-actions">
                                <span class="priority-badge text-xs px-2.5 py-1 rounded-full ${getPriorityClass(task.priority)} mr-3 sm:mr-4">
                                    ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                </span>
                                <button 
                                    class="delete-btn text-indigo-400 hover:text-red-500 transition-colors text-sm sm:text-base"
                                    data-id="${task.id}"
                                >
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    `).join('');
                    
                    // Add event listeners to new elements
                    document.querySelectorAll('.complete-btn').forEach(btn => {
                        btn.addEventListener('click', toggleTaskComplete);
                    });
                    
                    document.querySelectorAll('.delete-btn').forEach(btn => {
                        btn.addEventListener('click', deleteTask);
                    });
                    
                    // Add drag and drop functionality
                    setupDragAndDrop();
                }
            }

            function getPriorityClass(priority) {
                const classes = {
                    high: 'bg-red-100 text-red-800',
                    medium: 'bg-yellow-100 text-yellow-800',
                    low: 'bg-green-100 text-green-800'
                };
                return classes[priority] || '';
            }

            function toggleTaskComplete(e) {
                const taskId = parseInt(e.target.dataset.id);
                const task = tasks.find(t => t.id === taskId);
                
                if (task) {
                    task.completed = !task.completed;
                    saveTasks();
                    renderTasks();
                    updateStats();
                }
            }

            function deleteTask(e) {
                const taskId = parseInt(e.target.closest('.delete-btn').dataset.id);
                tasks = tasks.filter(task => task.id !== taskId);
                saveTasks();
                renderTasks();
                updateStats();
            }

            function clearCompletedTasks() {
                tasks = tasks.filter(task => !task.completed);
                saveTasks();
                renderTasks();
                updateStats();
            }

            function setFilter(filter) {
                currentFilter = filter;
                
                // Update active filter button
                [filterAllBtn, filterActiveBtn, filterCompletedBtn].forEach(btn => {
                    btn.classList.remove('active', 'bg-indigo-600', 'text-white');
                    btn.classList.add('bg-white', 'bg-opacity-70', 'text-indigo-800');
                });
                
                const activeBtn = document.getElementById(`filter-${filter}`);
                activeBtn.classList.add('active', 'bg-indigo-600', 'text-white');
                activeBtn.classList.remove('bg-white', 'bg-opacity-70', 'text-indigo-800');
                
                renderTasks();
            }

            function updateStats() {
                const total = tasks.length;
                const completed = tasks.filter(task => task.completed).length;
                const remaining = total - completed;
                
                taskCount.textContent = remaining;
                totalCount.textContent = total;
                completedCount.textContent = completed;
                
                // Hide clear button if no completed tasks
                clearCompletedBtn.style.display = completed > 0 ? 'block' : 'none';
            }

            function saveTasks() {
                localStorage.setItem('tasks', JSON.stringify(tasks));
            }

            function setupDragAndDrop() {
                const taskItems = document.querySelectorAll('.task-item');
                
                taskItems.forEach(item => {
                    item.addEventListener('dragstart', function() {
                        this.classList.add('dragging');
                    });
                    
                    item.addEventListener('dragend', function() {
                        this.classList.remove('dragging');
                    });
                });
                
                taskList.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    const draggingItem = document.querySelector('.dragging');
                    if (!draggingItem) return;
                    
                    const afterElement = getDragAfterElement(this, e.clientY);
                    if (afterElement) {
                        afterElement.parentNode.insertBefore(draggingItem, afterElement);
                    } else {
                        this.appendChild(draggingItem);
                    }
                });
                
                taskList.addEventListener('drop', function(e) {
                    e.preventDefault();
                    const draggedId = parseInt(document.querySelector('.dragging').dataset.id);
                    const newOrder = Array.from(this.children)
                        .filter(child => child.id.startsWith('task-'))
                        .map(child => parseInt(child.dataset.id));
                    
                    // Reorder tasks array based on new DOM order
                    tasks.sort((a, b) => {
                        const aIndex = newOrder.indexOf(a.id);
                        const bIndex = newOrder.indexOf(b.id);
                        return aIndex - bIndex;
                    });
                    
                    saveTasks();
                });
            }
            
            function getDragAfterElement(container, y) {
                const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
                
                return draggableElements.reduce((closest, child) => {
                    const box = child.getBoundingClientRect();
                    const offset = y - box.top - box.height / 2;
                    
                    if (offset < 0 && offset > closest.offset) {
                        return { offset: offset, element: child };
                    } else {
                        return closest;
                    }
                }, { offset: Number.NEGATIVE_INFINITY }).element;
            }
        });