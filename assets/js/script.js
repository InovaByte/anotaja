document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const taskDate = document.getElementById('taskDate');
    const timeUnit = document.getElementById('timeUnit');
    const taskTimer = document.getElementById('taskTimer');
    const addTaskButton = document.getElementById('addTaskButton');
    const todoList = document.getElementById('todo');
    const inProgressList = document.getElementById('inProgress');
    const completedList = document.getElementById('completed');
    const clock = document.getElementById('clock');
    const themeToggleButton = document.getElementById('themeToggle');
    const aboutButton = document.getElementById('aboutButton');
    const contactButton = document.getElementById('contactButton');
    const aboutModal = document.getElementById('aboutModal');
    const contactModal = document.getElementById('contactModal');
    const closeAbout = document.getElementById('closeAbout');
    const closeContact = document.getElementById('closeContact');
    const reminderElement = document.getElementById('reminder');
    const beepSound = new Audio('path/to/beep-sound.mp3'); // Substitua pelo caminho do seu arquivo de som

    const lists = {
        todo: todoList,
        inProgress: inProgressList,
        completed: completedList,
    };

    // Carregar tarefas do localStorage
    loadTasks();

    // Adicionar eventos
    addTaskButton.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', event => {
        if (event.key === 'Enter') {
            addTask();
        }
    });

    themeToggleButton.addEventListener('click', () => {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        document.querySelector('.container').classList.toggle('dark-mode', isDarkMode);
        document.querySelector('header').classList.toggle('dark-mode', isDarkMode);
        document.querySelectorAll('.task-input input, .task-input select').forEach(el => el.classList.toggle('dark-mode', isDarkMode));
        document.querySelectorAll('.task-list').forEach(el => el.classList.toggle('dark-mode', isDarkMode));
        document.querySelectorAll('ul li').forEach(el => el.classList.toggle('dark-mode', isDarkMode));
        localStorage.setItem('dark-mode', isDarkMode);
    });

    aboutButton.addEventListener('click', () => openModal(aboutModal));
    contactButton.addEventListener('click', () => openModal(contactModal));
    closeAbout.addEventListener('click', () => closeModal(aboutModal));
    closeContact.addEventListener('click', () => closeModal(contactModal));

    window.addEventListener('click', event => {
        if (event.target === aboutModal) {
            closeModal(aboutModal);
        }
        if (event.target === contactModal) {
            closeModal(contactModal);
        }
    });

    function openModal(modal) {
        modal.style.display = 'block';
    }

    function closeModal(modal) {
        modal.style.display = 'none';
    }

    function addTask() {
        const taskText = taskInput.value.trim();
        const dateValue = taskDate.value;
        const timerValue = parseInt(taskTimer.value, 10);
        const unit = timeUnit.value;

        if (taskText === '' || dateValue === '' || isNaN(timerValue)) {
            console.error('Inputs inválidos:', { taskText, dateValue, timerValue });
            return;
        }

        const currentTime = new Date();
        const deadlineTime = new Date(currentTime);

        switch (unit) {
            case 'minutes':
                deadlineTime.setMinutes(deadlineTime.getMinutes() + timerValue);
                break;
            case 'hours':
                deadlineTime.setHours(deadlineTime.getHours() + timerValue);
                break;
            case 'days':
                deadlineTime.setDate(deadlineTime.getDate() + timerValue);
                break;
        }

        const taskData = {
            text: taskText,
            timestamp: currentTime.toISOString(),
            deadline: deadlineTime.toISOString()
        };

        addTaskToList(todoList, taskData);

        // Salvar tarefa no localStorage
        saveTasks();

        // Limpar os campos de entrada
        taskInput.value = '';
        taskDate.value = '';
        taskTimer.value = '';
    }

    function addTaskToList(list, taskData) {
        const existingTask = Array.from(list.querySelectorAll('li')).find(task =>
            task.dataset.timestamp === taskData.timestamp
        );

        if (existingTask) return; // Ignorar se a tarefa já existe

        const li = document.createElement('li');
        li.innerHTML = `${taskData.text} <span class="timestamp">${new Date(taskData.timestamp).toLocaleString()}</span> <span class="deadline">Prazo: ${new Date(taskData.deadline).toLocaleString()}</span> <button class="move-button">→</button> <button class="remove-button">×</button>`;
        li.dataset.timestamp = taskData.timestamp;
        li.dataset.deadline = taskData.deadline;

        const moveButton = li.querySelector('.move-button');
        moveButton.addEventListener('click', () => moveTask(li, new Date(taskData.deadline)));

        const removeButton = li.querySelector('.remove-button');
        removeButton.addEventListener('click', () => {
            li.remove();
            saveTasks(); // Salvar após remoção
        });

        list.appendChild(li);
    }

    function moveTask(taskItem, deadlineTime) {
        const currentList = taskItem.parentElement;
        const nextList = getNextList(currentList.id);

        if (nextList) {
            currentList.removeChild(taskItem);
            addTaskToList(nextList, {
                text: taskItem.firstChild.textContent,
                timestamp: taskItem.dataset.timestamp,
                deadline: taskItem.dataset.deadline
            });
            saveTasks(); // Salvar após mover
        }
    }

    function getNextList(currentListId) {
        switch (currentListId) {
            case 'todo':
                return inProgressList;
            case 'inProgress':
                return completedList;
            case 'completed':
                return null;
        }
    }

    function saveTasks() {
        const tasks = {};
        Object.keys(lists).forEach(key => {
            tasks[key] = Array.from(lists[key].querySelectorAll('li')).map(task => ({
                text: task.firstChild.textContent,
                timestamp: task.dataset.timestamp,
                deadline: task.dataset.deadline
            }));
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || {};
        Object.keys(lists).forEach(key => {
            if (tasks[key]) {
                tasks[key].forEach(task => {
                    addTaskToList(lists[key], task);
                });
            }
        });
    }

    function updateClock() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        clock.textContent = `${hours}:${minutes}:${seconds}`;
    }

    function checkDeadlines() {
        const now = new Date();
        const tasks = document.querySelectorAll('.task-list li');

        tasks.forEach(task => {
            const deadline = new Date(task.dataset.deadline);
            if (now >= deadline && !task.classList.contains('notified')) {
                task.classList.add('notified');
                reminderElement.textContent = `Tarefa "${task.firstChild.textContent}" está atrasada!`;
                reminderElement.classList.add('show');
                beepSound.play();
                
                setTimeout(() => {
                    reminderElement.classList.remove('show');
                }, 5000); // Exibe o lembrete por 5 segundos
            }
        });
    }

    setInterval(updateClock, 1000);
    setInterval(checkDeadlines, 60000); // Verifica prazos a cada minuto
});
