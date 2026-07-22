const http = require('http');
const fs = require('fs').promises;
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'todos.json');

// Mime types mapping
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

// Helper functions to read/write JSON data
async function readTodos() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error('Error reading data file:', error);
    return [];
  }
}

async function writeTodos(todos) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(todos, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing data file:', error);
  }
}

// Create Pure HTTP Server
const server = http.createServer(async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;
    const method = req.method;

    // API Endpoints
    
    // 1. GET & POST /api/todos
    if (pathname === '/api/todos') {
      if (method === 'GET') {
        const todos = await readTodos();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(todos));
        return;
      } 
      
      if (method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });
        
        req.on('end', async () => {
          try {
            const { text, priority, category, dueDate } = JSON.parse(body);
            
            if (!text) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Task text is required' }));
              return;
            }

            const newTodo = {
              id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
              text: text.trim(),
              priority: priority || 'medium',
              category: category || 'Personal',
              dueDate: dueDate || null,
              completed: false,
              createdAt: new Date().toISOString()
            };

            const todos = await readTodos();
            todos.unshift(newTodo);
            await writeTodos(todos);

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(newTodo));
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON body' }));
          }
        });
        return;
      }
    }

    // 2. PUT & DELETE /api/todos/:id
    const matchIdRoute = pathname.match(/^\/api\/todos\/([a-zA-Z0-9]+)$/);
    if (matchIdRoute) {
      const id = matchIdRoute[1];

      if (method === 'PUT') {
        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const { text, priority, category, dueDate, completed } = JSON.parse(body);
            const todos = await readTodos();
            const index = todos.findIndex(t => t.id === id);

            if (index === -1) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Task not found' }));
              return;
            }

            if (text !== undefined) todos[index].text = text.trim();
            if (priority !== undefined) todos[index].priority = priority;
            if (category !== undefined) todos[index].category = category;
            if (dueDate !== undefined) todos[index].dueDate = dueDate;
            if (completed !== undefined) todos[index].completed = completed;

            await writeTodos(todos);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(todos[index]));
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON body' }));
          }
        });
        return;
      }

      if (method === 'DELETE') {
        const todos = await readTodos();
        const filteredTodos = todos.filter(t => t.id !== id);

        if (todos.length === filteredTodos.length) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Task not found' }));
          return;
        }

        await writeTodos(filteredTodos);
        res.writeHead(204);
        res.end();
        return;
      }
    }

    // Static files server
    let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
    
    // Safe directory check to prevent directory traversal attacks
    const relative = path.relative(path.join(__dirname, 'public'), filePath);
    const isSafe = relative && !relative.startsWith('..') && !path.isAbsolute(relative);
    
    if (pathname !== '/' && !isSafe) {
      res.writeHead(403);
      res.end('403 Forbidden');
      return;
    }

    try {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const content = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // If it's a front-end route or missing file, fallback to index.html for SPA router
        try {
          const fallbackPath = path.join(__dirname, 'public', 'index.html');
          const fallbackContent = await fs.readFile(fallbackPath);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(fallbackContent);
        } catch (fallbackError) {
          res.writeHead(404);
          res.end('404 Not Found');
        }
      } else {
        res.writeHead(500);
        res.end(`500 Internal Server Error: ${error.code}`);
      }
    }
  } catch (globalError) {
    console.error(`[GLOBAL ERROR]`, globalError);
    try {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`500 Internal Server Error: ${globalError.message}`);
    } catch (e) {
      // Ignore
    }
  }
});

server.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  Taskify Pure Server is running at http://localhost:${PORT}`);
  console.log(`  Data storage: ${DATA_FILE}`);
  console.log(`==================================================`);
});
