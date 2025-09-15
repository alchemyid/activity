// renderer.js

let globalConfig;

document.addEventListener('DOMContentLoaded', async () => {
    globalConfig = await window.electronAPI.getConfig();

    populateProjects();
    populateLocations();

    document.getElementById('project-select').addEventListener('change', populateTasks);
    document.getElementById('activity-input').focus();
});

function populateProjects() {
    const projectSelect = document.getElementById('project-select');
    globalConfig.project_list.forEach(project => {
        const option = document.createElement('option');
        option.value = project.name;
        option.textContent = project.name;
        projectSelect.appendChild(option);
    });
    populateTasks(); // Panggil pertama kali untuk mengisi task
}

function populateTasks() {
    const projectSelect = document.getElementById('project-select');
    const taskSelect = document.getElementById('task-select');
    const selectedProjectName = projectSelect.value;

    // Kosongkan task dropdown
    taskSelect.innerHTML = '';

    const selectedProject = globalConfig.project_list.find(p => p.name === selectedProjectName);
    if (selectedProject) {
        selectedProject.tasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task;
            option.textContent = task;
            taskSelect.appendChild(option);
        });
    }
}

function populateLocations() {
    const locationSelect = document.getElementById('location-select');
    globalConfig.locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        locationSelect.appendChild(option);
    });
}

function saveAndHide() {
    const nama = globalConfig.user.name;
    const project = document.getElementById('project-select').value;
    const task = document.getElementById('task-select').value;
    const location = document.getElementById('location-select').value;
    const activity = document.getElementById('activity-input').value.trim();

    if (project && task && location && activity) {
        const data = [nama, project, task, location, activity];
        window.electronAPI.saveActivity(data);
    }

    window.electronAPI.closeWindow();
    document.getElementById('activity-input').value = '';
}