# ⚡ Fast CRUD Blueprint Guide (5-Minute Feature Recipe)

Use this exact recipe to spin up a new model, database table, API endpoints, realtime sync, and React UI whenever you get your hackathon problem statement.

---

## 1. Backend: Generate Everything with One Command

Inside `backend/`, run:
```bash
php artisan make:model Task -mcrR --api
```
*(Flags: `-m` migration, `-c` controller, `-r` resource controller, `-R` requests, `--api` API controller)*

Also create an API Resource:
```bash
php artisan make:resource TaskResource
```

---

## 2. Migration Schema (`backend/database/migrations/xxxx_create_tasks_table.php`)

```php
public function up(): void
{
    Schema::create('tasks', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
        $table->string('title');
        $table->text('description')->nullable();
        $table->string('status')->default('pending'); // pending, in_progress, done
        $table->timestamps();
    });
}
```
Run migration:
```bash
php artisan migrate
```

---

## 3. Eloquent Model (`backend/app/Models/Task.php`)

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    protected $fillable = ['user_id', 'title', 'description', 'status'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

---

## 4. Validation Requests (`backend/app/Http/Requests/StoreTaskRequest.php`)

```php
public function authorize(): bool { return true; }

public function rules(): array
{
    return [
        'title' => ['required', 'string', 'max:255'],
        'description' => ['nullable', 'string'],
        'status' => ['nullable', 'string', 'in:pending,in_progress,done'],
    ];
}
```

---

## 5. API Resource (`backend/app/Http/Resources/TaskResource.php`)

```php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'user' => $this->whenLoaded('user', fn() => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ]),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
```

---

## 6. Controller with Realtime Broadcast (`backend/app/Http/Controllers/TaskController.php`)

```php
namespace App\Http\Controllers;

use App\Models\Task;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Services\RealtimeService;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $tasks = Task::with('user')->latest()->paginate($request->query('per_page', 15));
        return TaskResource::collection($tasks);
    }

    public function store(StoreTaskRequest $request)
    {
        $data = $request->validated();
        if ($request->user()) {
            $data['user_id'] = $request->user()->id;
        }

        $task = Task::create($data)->load('user');
        $resource = new TaskResource($task);

        // ⚡ Realtime broadcast to all connected web clients:
        RealtimeService::broadcast('task:created', $resource->resolve(), 'tasks');

        return response()->json(['data' => $resource], 201);
    }

    public function show(Task $task)
    {
        return new TaskResource($task->load('user'));
    }

    public function update(UpdateTaskRequest $request, Task $task)
    {
        $task->update($request->validated());
        $resource = new TaskResource($task->load('user'));

        // ⚡ Realtime broadcast:
        RealtimeService::broadcast('task:updated', $resource->resolve(), 'tasks');

        return response()->json(['data' => $resource]);
    }

    public function destroy(Task $task)
    {
        $id = $task->id;
        $task->delete();

        // ⚡ Realtime broadcast:
        RealtimeService::broadcast('task:deleted', ['id' => $id], 'tasks');

        return response()->json(['id' => $id]);
    }
}
```

---

## 7. Register Route (`backend/routes/api.php`)

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('tasks', TaskController::class);
});
```

---

## 8. Frontend: Copy & Customize React Page

1. Duplicate `frontend/src/pages/ItemsPage.tsx` -> `frontend/src/pages/TasksPage.tsx`.
2. Find & replace `item` -> `task` and `Item` -> `Task`.
3. Add the route in `frontend/src/App.tsx`:
```tsx
<Route
  path="tasks"
  element={
    <ProtectedRoute>
      <TasksPage />
    </ProtectedRoute>
  }
/>
```
4. Add link in `frontend/src/components/layout/Navbar.tsx`.

Done! You now have a full-stack, authenticated, real-time syncing CRUD module running end-to-end.

