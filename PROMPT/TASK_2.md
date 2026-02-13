Polish the current project by doing this.

1. change the authentication method to use google login. Even better if we can just swip swap to use either and another method by abstracting the authentication method. So we can add more authentication method in the future.
2. Use websocket for real time updates. Use cloudflare durable object with sqlite backend. For example, when a user moves a task to another column, the other users should see the update in real time. This feature is an experimental feature and it should be able to be toggled on and off. 
3. Richen the notifications. For example, when a user is invited to a project, the user should receive a notification. When a user is assigned to a task, the user should receive a notification. When a user comments on a task, the user should receive a notification. 
4. Color code the tasks based on the project they belong to. 
5. List all of the user's tasks in a single page, regardless of the project they belong to. Add search and filter by project, status, and assignee.
6. Add webhook for each notification. The webhook should be able to be toggled on and off. 