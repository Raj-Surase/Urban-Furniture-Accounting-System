<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Journal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JournalController extends Controller
{
    private function authorizeJournalAccess(): void
    {
        $user = request()->user();
        if (! $user || (! $user->isAdmin() && ! $user->isManager() && ! $user->isAccountant())) {
            abort(403, 'Unauthorized access to accounting journals.');
        }
    }

    public function index(\Illuminate\Http\Request $request): JsonResponse
    {
        $this->authorizeJournalAccess();

        $query = Journal::with('defaultAccount')->orderBy('name');

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        if ($name = $request->query('name')) {
            $query->where('name', 'like', "%{$name}%");
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $journals = $query->get();
        return response()->json([
            'success' => true,
            'data' => $journals,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeJournalAccess();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:sales,purchase,bank,cash',
            'default_account_id' => 'nullable|exists:accounts,id',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $journal = Journal::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Journal created successfully',
            'data' => $journal->load('defaultAccount'),
        ], 201);
    }

    public function show(Journal $journal): JsonResponse
    {
        $this->authorizeJournalAccess();

        return response()->json([
            'success' => true,
            'data' => $journal->load('defaultAccount'),
        ]);
    }

    public function update(Request $request, Journal $journal): JsonResponse
    {
        $this->authorizeJournalAccess();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:sales,purchase,bank,cash',
            'default_account_id' => 'nullable|exists:accounts,id',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $journal->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Journal updated successfully',
            'data' => $journal->load('defaultAccount'),
        ]);
    }

    public function destroy(Journal $journal): JsonResponse
    {
        $this->authorizeJournalAccess();

        $journal->delete();

        return response()->json([
            'success' => true,
            'message' => 'Journal deleted successfully',
        ]);
    }
}
