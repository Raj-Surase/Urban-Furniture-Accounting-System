<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Journal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JournalController extends Controller
{
    public function index(): JsonResponse
    {
        $journals = Journal::with('defaultAccount')->orderBy('name')->get();
        return response()->json([
            'success' => true,
            'data' => $journals,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
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
        return response()->json([
            'success' => true,
            'data' => $journal->load('defaultAccount'),
        ]);
    }

    public function update(Request $request, Journal $journal): JsonResponse
    {
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
        $journal->delete();

        return response()->json([
            'success' => true,
            'message' => 'Journal deleted successfully',
        ]);
    }
}
