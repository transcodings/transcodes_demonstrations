import { Router, Request, Response } from 'express';
import { Todo, CreateTodoRequest, UpdateTodoRequest } from '../types/todo';

const router = Router();

// In-memory storage (replace with database later)
let todos: Todo[] = [];

// GET /api/todos - Get all todos
router.get('/', (req: Request, res: Response) => {
  res.json(todos);
});

// GET /api/todos/:id - Get a specific todo
router.get('/:id', (req: Request, res: Response) => {
  const todo = todos.find((t) => t.id === req.params.id);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  res.json(todo);
});

// POST /api/todos - Create a new todo
router.post('/', (req: Request, res: Response) => {
  const { title, description }: CreateTodoRequest = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }

  const newTodo: Todo = {
    id: Date.now().toString(),
    title: title.trim(),
    description: description?.trim() || '',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  todos.push(newTodo);
  res.status(201).json(newTodo);
});

// PUT /api/todos/:id - Update a todo
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, completed }: UpdateTodoRequest = req.body;

  const todoIndex = todos.findIndex((t) => t.id === id);

  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  const updatedTodo: Todo = {
    ...todos[todoIndex],
    ...(title !== undefined && { title: title.trim() }),
    ...(description !== undefined && { description: description.trim() }),
    ...(completed !== undefined && { completed }),
    updatedAt: new Date().toISOString(),
  };

  todos[todoIndex] = updatedTodo;
  res.json(updatedTodo);
});

// PATCH /api/todos/:id/toggle - Toggle todo completion
router.patch('/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;
  const todoIndex = todos.findIndex((t) => t.id === id);

  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  todos[todoIndex] = {
    ...todos[todoIndex],
    completed: !todos[todoIndex].completed,
    updatedAt: new Date().toISOString(),
  };

  res.json(todos[todoIndex]);
});

// DELETE /api/todos/:id - Delete a todo
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const todoIndex = todos.findIndex((t) => t.id === id);

  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  const deletedTodo = todos[todoIndex];
  todos = todos.filter((t) => t.id !== id);

  res.json({ message: 'Todo deleted successfully', todo: deletedTodo });
});

// DELETE /api/todos - Delete all todos
router.delete('/', (req: Request, res: Response) => {
  const count = todos.length;
  todos = [];
  res.json({ message: `Deleted ${count} todos` });
});

export default router;
