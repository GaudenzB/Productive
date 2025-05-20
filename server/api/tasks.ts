/**
 * @openapi
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the task
 *         title:
 *           type: string
 *           description: Task title
 *         description:
 *           type: string
 *           nullable: true
 *           description: Detailed description of the task
 *         status:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, COMPLETED]
 *           description: Current status of the task
 *         priority:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *           description: Priority level of the task
 *         dueDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Due date for the task
 *         projectId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the project this task belongs to
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user who owns this task
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the task was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the task was last updated
 *       required:
 *         - id
 *         - title
 *         - status
 *         - priority
 *         - userId
 *         - createdAt
 *         - updatedAt
 *     TaskCreate:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Task title
 *         description:
 *           type: string
 *           nullable: true
 *           description: Detailed description of the task
 *         status:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, COMPLETED]
 *           description: Current status of the task
 *         priority:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *           description: Priority level of the task
 *         dueDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Due date for the task
 *         projectId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the project this task belongs to
 *       required:
 *         - title
 *         - status
 *         - priority
 *     TaskUpdate:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Task title
 *         description:
 *           type: string
 *           nullable: true
 *           description: Detailed description of the task
 *         status:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, COMPLETED]
 *           description: Current status of the task
 *         priority:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *           description: Priority level of the task
 *         dueDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Due date for the task
 *         projectId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the project this task belongs to
 */

/**
 * @openapi
 * tags:
 *   name: Tasks
 *   description: Task management endpoints
 */

/**
 * @openapi
 * /tasks:
 *   get:
 *     summary: Get all tasks for the current user
 *     description: Retrieves all tasks belonging to the authenticated user
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   post:
 *     summary: Create a new task
 *     description: Creates a new task for the authenticated user
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskCreate'
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /tasks/{id}:
 *   parameters:
 *    - in: path
 *      name: id
 *      required: true
 *      schema:
 *        type: string
 *        format: uuid
 *      description: Task ID
 *   get:
 *     summary: Get a specific task
 *     description: Retrieves a specific task by ID
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Task details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   patch:
 *     summary: Update a task
 *     description: Updates an existing task
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskUpdate'
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   delete:
 *     summary: Delete a task
 *     description: Deletes an existing task
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       204:
 *         description: Task deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */