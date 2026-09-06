<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreItemRequest;
use App\Http\Requests\UpdateItemRequest;
use App\Http\Resources\ItemResource;
use App\Models\Item;
use App\Services\RealtimeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

use Illuminate\Support\Facades\Gate;

class ItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Item::class);

        $user = $request->user();
        $query = Item::with('user')->latest();

        // Non-admin/manager users without view_any only see their own items
        if (! $user->hasPermission(\App\Security\Rbac::PERMISSION_ITEMS_VIEW_ANY)) {
            $query->where('user_id', $user->id);
        } elseif ($request->boolean('mine')) {
            $query->where('user_id', $user->id);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($priority = $request->query('priority')) {
            $query->where('priority', $priority);
        }

        $perPage = $request->query('per_page', 15);
        if ($perPage === 'all' || $perPage === '-1') {
            $items = $query->get();
            return ItemResource::collection($items);
        }

        $items = $query->paginate(is_numeric($perPage) ? (int)$perPage : 15);

        return ItemResource::collection($items);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreItemRequest $request): JsonResponse
    {
        Gate::authorize('create', Item::class);

        $data = $request->validated();
        if ($request->user()) {
            $data['user_id'] = $request->user()->id;
        }

        $item = Item::create($data);
        $item->load('user');

        $resource = new ItemResource($item);

        // Realtime broadcast via Socket.io
        RealtimeService::broadcast('item:created', $resource->resolve(), 'items');

        return response()->json([
            'message' => 'Item created successfully',
            'data' => $resource,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Item $item): ItemResource
    {
        Gate::authorize('view', $item);

        $item->load('user');
        return new ItemResource($item);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateItemRequest $request, Item $item): JsonResponse
    {
        Gate::authorize('update', $item);

        $item->update($request->validated());
        $item->load('user');

        $resource = new ItemResource($item);

        // Realtime broadcast via Socket.io
        RealtimeService::broadcast('item:updated', $resource->resolve(), 'items');

        return response()->json([
            'message' => 'Item updated successfully',
            'data' => $resource,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Item $item): JsonResponse
    {
        Gate::authorize('delete', $item);

        $itemId = $item->id;
        $item->delete();

        // Realtime broadcast via Socket.io
        RealtimeService::broadcast('item:deleted', ['id' => $itemId], 'items');

        return response()->json([
            'message' => 'Item deleted successfully',
            'id' => $itemId,
        ]);
    }
}

