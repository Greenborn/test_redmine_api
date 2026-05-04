const path = require('path');
const axios = require('axios');
const readline = require('readline');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { URL, API_KEY } = process.env;

if (!URL || !API_KEY) {
  console.error('Falta URL o API_KEY en el archivo .env');
  process.exit(1);
}

const baseUrl = URL.replace(/\/+$/, '');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function question(promptText) {
  return new Promise((resolve) => rl.question(promptText, (answer) => resolve(answer.trim())));
}

function printList(items, label, format) {
  items.forEach((item, index) => {
    console.log(`${index + 1}. ${format(item)}`);
  });
}

async function selectFromList(items, label, format, allowSkip = false) {
  if (!items.length) {
    return null;
  }

  printList(items, label, format);
  if (allowSkip) {
    console.log('0. No asignar');
  }

  while (true) {
    const answer = await question(`Selecciona ${label} por número${allowSkip ? ' o 0 para omitir' : ''}: `);
    if (allowSkip && answer === '0') {
      return null;
    }

    const index = Number(answer) - 1;
    if (Number.isInteger(index) && index >= 0 && index < items.length) {
      return items[index];
    }

    console.log('Selección inválida, intenta nuevamente.');
  }
}

async function fetchProjects() {
  const endpoint = `${baseUrl}/projects.json?membership=true&limit=100`;
  const response = await axios.get(endpoint, {
    headers: {
      'X-Redmine-API-Key': API_KEY,
      Accept: 'application/json',
    },
  });
  return response.data.projects || [];
}

async function fetchProjectMembers(projectId) {
  const endpoint = `${baseUrl}/projects/${encodeURIComponent(projectId)}/memberships.json`;
  const response = await axios.get(endpoint, {
    headers: {
      'X-Redmine-API-Key': API_KEY,
      Accept: 'application/json',
    },
  });
  return response.data.memberships || [];
}

async function fetchTrackers() {
  const endpoint = `${baseUrl}/trackers.json`;
  const response = await axios.get(endpoint, {
    headers: {
      'X-Redmine-API-Key': API_KEY,
      Accept: 'application/json',
    },
  });
  return response.data.trackers || [];
}

async function fetchPriorities() {
  const endpoint = `${baseUrl}/enumerations/issue_priorities.json`;
  const response = await axios.get(endpoint, {
    headers: {
      'X-Redmine-API-Key': API_KEY,
      Accept: 'application/json',
    },
  });
  return response.data.issue_priorities || [];
}

async function createIssue(issueData) {
  const endpoint = `${baseUrl}/issues.json`;
  const response = await axios.post(endpoint, { issue: issueData }, {
    headers: {
      'X-Redmine-API-Key': API_KEY,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
  return response.data.issue;
}

async function main() {
  try {
    const projects = await fetchProjects();
    if (!projects.length) {
      console.error('No se encontraron proyectos vinculados al usuario.');
      process.exit(1);
    }

    console.log('Proyectos:');
    const project = await selectFromList(projects, 'proyecto', (p) => `${p.name} [${p.id}] (${p.identifier})`);
    if (!project) {
      console.error('No se seleccionó ningún proyecto.');
      process.exit(1);
    }

    const memberships = await fetchProjectMembers(project.id);
    let assigneeId = null;

    if (memberships.length) {
      console.log(`\nMiembros del proyecto ${project.name}:`);
      const member = await selectFromList(
        memberships,
        'miembro para asignar',
        (m) => `${m.user.name} [${m.user.id}] — ${m.roles.map((role) => role.name).join(', ')}`
      );
      if (member) {
        assigneeId = member.user.id;
      }
    } else {
      console.log(`\nEl proyecto ${project.name} no tiene miembros listados o no se pudieron obtener.`);
    }

    const trackers = await fetchTrackers();
    let trackerId = null;

    if (trackers.length) {
      console.log('\nTrackers disponibles:');
      const tracker = await selectFromList(trackers, 'tracker', (t) => `${t.name} [${t.id}]`);
      if (tracker) {
        trackerId = tracker.id;
      }
    }

    const priorities = await fetchPriorities();
    let priorityId = null;
    if (priorities.length) {
      console.log('\nPrioridades disponibles:');
      const priority = await selectFromList(priorities, 'prioridad', (p) => `${p.name} [${p.id}]`, true);
      if (priority) {
        priorityId = priority.id;
      }
    } else {
      const priorityAnswer = await question('Priority ID (opcional): ');
      if (priorityAnswer) {
        const parsedPriority = Number(priorityAnswer);
        if (Number.isInteger(parsedPriority) && parsedPriority > 0) {
          priorityId = parsedPriority;
        }
      }
    }

    const subject = await question('\nAsunto (subject): ');
    if (!subject) {
      console.error('El asunto es obligatorio.');
      process.exit(1);
    }

    const description = await question('Descripción (opcional): ');
    const startDate = await question('Fecha de inicio (YYYY-MM-DD, opcional): ');
    const dueDate = await question('Fecha de vencimiento (YYYY-MM-DD, opcional): ');

    const issueData = {
      project_id: project.id,
      subject,
    };

    if (description) issueData.description = description;
    if (assigneeId) issueData.assigned_to_id = assigneeId;
    if (trackerId) issueData.tracker_id = trackerId;
    if (priorityId) {
      issueData.priority_id = priorityId;
    }
    if (startDate) issueData.start_date = startDate;
    if (dueDate) issueData.due_date = dueDate;

    console.log('\nCreando ticket...');
    const issue = await createIssue(issueData);
    console.log(`Ticket creado: ID ${issue.id}, Subject: ${issue.subject}`);
    console.log(`URL: ${baseUrl}/issues/${issue.id}`);
  } catch (error) {
    if (error.response) {
      console.error('Error de API:', error.response.status, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error de conexión:', error.message);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
