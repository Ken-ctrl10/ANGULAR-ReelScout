<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

/**
 * Token-based auth with Sanctum. The Angular app stores the token
 * and sends it as "Authorization: Bearer <token>".
 */
class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        // The User model casts 'password' as 'hashed', so it's hashed on save.
        $user = User::create($validated);

        return response()->json([
            'user' => $user,
            'token' => $user->createToken('reel-scout')->plainTextToken,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            // Same message for "no such email" and "wrong password",
            // so attackers can't tell which emails are registered.
            throw ValidationException::withMessages([
                'email' => 'The email or password is incorrect.',
            ]);
        }

        return response()->json([
            'user' => $user,
            'token' => $user->createToken('reel-scout')->plainTextToken,
        ]);
    }

    public function logout(Request $request): Response
    {
        // Revoke only the token used for this request (this device).
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }
}
