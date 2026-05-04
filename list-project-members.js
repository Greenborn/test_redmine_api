const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { URL, API_KEY } = process.env;
const projectId = process.argv[2];

if (!URL || !API_KEY) {
  console.error('Falta URL o API_KEY en el archivo .env');
  process.exit(1);
}

if (!projectId) {
  console.error('Uso: node list-project-members.js <project_id>');
  process.exit(1);
}

const baseUrl = URL.replace(/\/+$/, '');
const endpoint = `${baseUrl}/projects/${encodeURIComponent(projectId)}/memberships.json`;

async function fetchProjectMembers() {
  try {
    const response = await axios.get(endpoint, {
      headers: {
        'X-Redmine-API-Key': API_KEY,
        Accept: 'application/json',
      },
      timeout: 10000,
    });

    const memberships = response.data.memberships || [];
    console.log(`Integrantes del proyecto ${projectId}: ${memberships.length}`);
    memberships.forEach((membership) => {
      const user = membership.user || {};
      const roles = (membership.roles || []).map((r) => r.name).join(', ');
      console.log(`- [${user.id}] ${user.name}${roles ? ` — roles: ${roles}` : ''}`);
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

fetchProjectMembers();
