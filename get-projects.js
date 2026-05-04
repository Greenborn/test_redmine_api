const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { URL, API_KEY } = process.env;

if (!URL || !API_KEY) {
  console.error('Falta URL o API_KEY en el archivo .env');
  process.exit(1);
}

const baseUrl = URL.replace(/\/+$/, '');
const endpoint = `${baseUrl}/projects.json?membership=true&limit=100`;

async function fetchUserProjects() {
  try {
    const response = await axios.get(endpoint, {
      headers: {
        'X-Redmine-API-Key': API_KEY,
        Accept: 'application/json',
      },
      timeout: 10000,
    });

    const projects = response.data.projects || [];
    console.log(`Proyectos encontrados: ${projects.length}`);
    projects.forEach((project) => {
      console.log(`- [${project.id}] ${project.name} (${project.identifier})`);
    });
  } catch (error) {
    if (error.response) {
      console.error('Error de API:', error.response.status, error.response.data);
    } else {
      console.error('Error de conexión:', error.message);
    }
    process.exit(1);
  }
}

fetchUserProjects();
